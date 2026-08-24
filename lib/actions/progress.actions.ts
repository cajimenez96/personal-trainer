"use server"

import { z } from "zod"
import { studentService } from "@/lib/services/student.service"
import { assignedRoutineService } from "@/lib/services/assigned-routine.service"
import { progressLogService, todayUTC } from "@/lib/services/progress-log.service"
import { dniSchema } from "@/lib/validators/portal"
import { NOTE_TYPE_VALUES } from "@/lib/validators/progress-note"

const logProgressSchema = z.object({
  dni: z.string(),
  assignedRoutineId: z.string().uuid(),
  exerciseBlockId: z.string().uuid(),
  completed: z.boolean(),
  weightKg: z.number().positive().nullable(),
  studentNotes: z.string().trim().max(500, "Máximo 500 caracteres").nullable(),
  noteType: z.enum(NOTE_TYPE_VALUES).nullable().optional(),
})

export type LogProgressInput = z.infer<typeof logProgressSchema>
export type LogProgressState = { ok: boolean; error?: string }

export async function logProgressAction(input: LogProgressInput): Promise<LogProgressState> {
  const parsed = logProgressSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Datos inválidos." }

  const dniParsed = dniSchema.safeParse(parsed.data.dni)
  if (!dniParsed.success) return { ok: false, error: "DNI inválido." }

  // Never trust a client-supplied studentId on this unauthenticated route —
  // re-derive it from the (re-validated) DNI and check ownership from there.
  const student = await studentService.getByDni(dniParsed.data)
  if (!student || !student.isActive) return { ok: false, error: "Alumno no encontrado." }

  const routine = await assignedRoutineService.getDetail(parsed.data.assignedRoutineId)
  if (!routine || routine.studentId !== student.id) {
    return { ok: false, error: "Rutina no encontrada." }
  }

  const blockBelongsToRoutine = routine.days.some((day) =>
    day.blocks.some((block) => block.id === parsed.data.exerciseBlockId),
  )
  if (!blockBelongsToRoutine) return { ok: false, error: "Ejercicio no encontrado." }

  await progressLogService.upsert({
    studentId: student.id,
    assignedRoutineId: routine.id,
    exerciseBlockId: parsed.data.exerciseBlockId,
    loggedDate: todayUTC(),
    completed: parsed.data.completed,
    weightKg: parsed.data.weightKg,
    studentNotes: parsed.data.studentNotes,
    noteType: parsed.data.noteType ?? null,
  })

  return { ok: true }
}

const batchLogWeightsSchema = z.object({
  dni: z.string(),
  assignedRoutineId: z.string().uuid(),
  entries: z.array(
    z.object({
      exerciseBlockId: z.string().uuid(),
      weightKg: z.number().positive().nullable(),
      studentNotes: z.string().trim().max(500, "Máximo 500 caracteres").nullable().optional(),
    }),
  ),
})

export type BatchLogWeightsInput = z.infer<typeof batchLogWeightsSchema>

export async function batchLogWeightsAction(input: BatchLogWeightsInput): Promise<LogProgressState> {
  const parsed = batchLogWeightsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Datos inválidos." }

  const dniParsed = dniSchema.safeParse(parsed.data.dni)
  if (!dniParsed.success) return { ok: false, error: "DNI inválido." }

  const student = await studentService.getByDni(dniParsed.data)
  if (!student || !student.isActive) return { ok: false, error: "Alumno no encontrado." }

  const routine = await assignedRoutineService.getDetail(parsed.data.assignedRoutineId)
  if (!routine || routine.studentId !== student.id) {
    return { ok: false, error: "Rutina no encontrada." }
  }

  const today = todayUTC()
  for (const entry of parsed.data.entries) {
    await progressLogService.upsert({
      studentId: student.id,
      assignedRoutineId: routine.id,
      exerciseBlockId: entry.exerciseBlockId,
      loggedDate: today,
      weightKg: entry.weightKg,
      studentNotes: entry.studentNotes ?? null,
    })
  }

  return { ok: true }
}

export async function getStudentProgressHistoryAction(dni: string) {
  const dniParsed = dniSchema.safeParse(dni)
  if (!dniParsed.success) return { ok: false, error: "DNI inválido.", items: [] }

  const student = await studentService.getByDni(dniParsed.data)
  if (!student || !student.isActive) return { ok: false, error: "Alumno no encontrado.", items: [] }

  const items = await progressLogService.getHistory(student.id, {})
  return { ok: true, items }
}
