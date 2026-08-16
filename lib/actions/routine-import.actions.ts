"use server"

import { z } from "zod"
import { db } from "@/lib/db"
import { exerciseService } from "@/lib/services/exercise.service"
import { routineTemplateService } from "@/lib/services/routine-template.service"
import { assignedRoutineService } from "@/lib/services/assigned-routine.service"
import { studentService } from "@/lib/services/student.service"

const refsSchema = z.object({
  exerciseNames: z.array(z.string()).max(500),
  studentDnis: z.array(z.string()).max(500),
})

export type RoutineImportRefs = {
  existingExerciseNames: string[]
  missingDnis: string[]
}

// One round-trip to know which exercise names already exist in the catalog
// (so the client can require primaryMuscle only for genuinely new ones) and
// which referenced DNIs don't correspond to an active student (RF-3.5:
// "DNI no registrados" is a hard validation error, not a warning).
export async function checkRoutineImportRefsAction(
  input: z.infer<typeof refsSchema>,
): Promise<RoutineImportRefs> {
  const { exerciseNames, studentDnis } = refsSchema.parse(input)

  const [existingExercises, existingStudents] = await Promise.all([
    exerciseNames.length
      ? db.exercise.findMany({ where: { name: { in: exerciseNames } }, select: { name: true } })
      : Promise.resolve([]),
    studentDnis.length
      ? db.student.findMany({
          where: { dni: { in: studentDnis }, isActive: true },
          select: { dni: true },
        })
      : Promise.resolve([]),
  ])

  const foundDnis = new Set(existingStudents.map((s) => s.dni))

  return {
    existingExerciseNames: existingExercises.map((e) => e.name),
    missingDnis: studentDnis.filter((dni) => !foundDnis.has(dni)),
  }
}

export type TemplateImportBlock = {
  exerciseName: string
  primaryMuscle: string
  secondaryMuscle?: string
  videoUrl?: string
  sets: number
  reps?: number
  repsScheme?: string
  weightKg?: number
  intensity?: string
  tempo?: string
  durationSecs?: number
  restSecs?: number
  trainerNotes?: string
  groupLabel?: string
  groupRestSecs?: number
}

export type TemplateImportUnit = {
  name: string
  description?: string
  durationWeeks: number
  days: { label: string; blocks: TemplateImportBlock[] }[]
  studentDnis: string[]
}

export type ImportRoutinesChunkResult = {
  succeeded: string[]
  failed: { templateName: string; error: string }[]
  assignmentWarnings: { templateName: string; dni: string; error: string }[]
}

export async function importRoutineTemplatesChunkAction(
  templates: TemplateImportUnit[],
): Promise<ImportRoutinesChunkResult> {
  if (templates.length === 0 || templates.length > 50) {
    throw new Error("Chunk inválido: debe tener entre 1 y 50 plantillas")
  }

  const succeeded: string[] = []
  const failed: { templateName: string; error: string }[] = []
  const assignmentWarnings: { templateName: string; dni: string; error: string }[] = []

  for (const unit of templates) {
    try {
      const exerciseIdByName = new Map<string, string>()
      for (const day of unit.days) {
        for (const block of day.blocks) {
          if (exerciseIdByName.has(block.exerciseName)) continue
          const exercise = await exerciseService.findOrCreate({
            name: block.exerciseName,
            primaryMuscle: block.primaryMuscle,
            secondaryMuscle: block.secondaryMuscle,
            videoUrl: block.videoUrl,
          })
          exerciseIdByName.set(block.exerciseName, exercise.id)
        }
      }

      const template = await routineTemplateService.create({
        name: unit.name,
        description: unit.description,
        durationWeeks: unit.durationWeeks,
        days: unit.days.map((day) => ({
          label: day.label,
          blocks: day.blocks.map((block) => ({
            exerciseId: exerciseIdByName.get(block.exerciseName)!,
            sets: block.sets,
            reps: block.reps ?? null,
            repsScheme: block.repsScheme ?? null,
            weightKg: block.weightKg ?? null,
            intensity: block.intensity ?? null,
            tempo: block.tempo ?? null,
            durationSecs: block.durationSecs ?? null,
            restSecs: block.restSecs ?? null,
            trainerNotes: block.trainerNotes ?? null,
            groupLabel: block.groupLabel ?? null,
            groupRestSecs: block.groupRestSecs ?? null,
          })),
        })),
      })

      succeeded.push(unit.name)

      for (const dni of unit.studentDnis) {
        try {
          const student = await studentService.getByDni(dni)
          if (!student) throw new Error(`DNI ${dni} no encontrado`)
          await assignedRoutineService.assign({
            studentId: student.id,
            templateId: template.id,
            overrides: [],
          })
        } catch (err) {
          assignmentWarnings.push({
            templateName: unit.name,
            dni,
            error: err instanceof Error ? err.message : "Error desconocido",
          })
        }
      }
    } catch (err) {
      failed.push({
        templateName: unit.name,
        error: err instanceof Error ? err.message : "Error desconocido",
      })
    }
  }

  return { succeeded, failed, assignmentWarnings }
}
