"use client"

import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { ImportRunner, type RowError } from "@/components/admin/import-runner"
import { routineImportRowSchema } from "@/lib/validators/routine-import"
import {
  checkRoutineImportRefsAction,
  importRoutineTemplatesChunkAction,
  type ImportRoutinesChunkResult,
  type TemplateImportUnit,
} from "@/lib/actions/routine-import.actions"

const DEFAULT_DURATION_WEEKS = 4

type BuilderBlock = {
  blockOrder: number
  exerciseName: string
  primaryMuscle?: string
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

type BuilderDay = { dayOrder: number; label: string; blocks: BuilderBlock[] }

type BuilderTemplate = {
  description?: string
  durationWeeks?: number
  days: Map<string, BuilderDay>
  dnis: Set<string>
}

function buildTemplateUnits(
  templates: Map<string, BuilderTemplate>,
  exerciseMeta: Map<string, { primaryMuscle?: string; secondaryMuscle?: string; videoUrl?: string }>,
): TemplateImportUnit[] {
  return [...templates.entries()].map(([name, tpl]) => ({
    name,
    description: tpl.description,
    durationWeeks: tpl.durationWeeks ?? DEFAULT_DURATION_WEEKS,
    studentDnis: [...tpl.dnis],
    days: [...tpl.days.values()]
      .sort((a, b) => a.dayOrder - b.dayOrder)
      .map((day) => ({
        label: day.label,
        blocks: [...day.blocks]
          .sort((a, b) => a.blockOrder - b.blockOrder)
          .map((block) => {
            const meta = exerciseMeta.get(block.exerciseName)
            return {
              exerciseName: block.exerciseName,
              primaryMuscle: meta?.primaryMuscle ?? "",
              secondaryMuscle: meta?.secondaryMuscle,
              videoUrl: meta?.videoUrl,
              sets: block.sets,
              reps: block.reps,
              repsScheme: block.repsScheme,
              weightKg: block.weightKg,
              intensity: block.intensity,
              tempo: block.tempo,
              durationSecs: block.durationSecs,
              restSecs: block.restSecs,
              trainerNotes: block.trainerNotes,
              groupLabel: block.groupLabel,
              groupRestSecs: block.groupRestSecs,
            }
          }),
      })),
  }))
}

async function validateTemplatesFile(
  file: File,
): Promise<{ errors: RowError[]; units: TemplateImportUnit[] }> {
  const { data } = Papa.parse<Record<string, string>>(await file.text(), {
    header: true,
    skipEmptyLines: true,
  })

  const rowErrors: RowError[] = []
  const templates = new Map<string, BuilderTemplate>()
  const exerciseMeta = new Map<
    string,
    { primaryMuscle?: string; secondaryMuscle?: string; videoUrl?: string }
  >()
  const dniRows = new Map<string, number[]>()

  data.forEach((raw, index) => {
    const rowNumber = index + 2
    const parsed = routineImportRowSchema.safeParse(raw)

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        rowErrors.push({ row: rowNumber, message: `${issue.path.join(".")}: ${issue.message}` })
      }
      return
    }

    const row = parsed.data

    if (!exerciseMeta.has(row.exerciseName) && row.primaryMuscle) {
      exerciseMeta.set(row.exerciseName, {
        primaryMuscle: row.primaryMuscle,
        secondaryMuscle: row.secondaryMuscle,
        videoUrl: row.videoUrl,
      })
    }

    let template = templates.get(row.templateName)
    if (!template) {
      template = { description: row.templateDescription, durationWeeks: row.durationWeeks, days: new Map(), dnis: new Set() }
      templates.set(row.templateName, template)
    }
    if (row.durationWeeks && !template.durationWeeks) template.durationWeeks = row.durationWeeks
    if (row.templateDescription && !template.description) template.description = row.templateDescription

    let day = template.days.get(row.dayLabel)
    if (!day) {
      day = { dayOrder: row.dayOrder, label: row.dayLabel, blocks: [] }
      template.days.set(row.dayLabel, day)
    }
    day.blocks.push({
      blockOrder: row.blockOrder,
      exerciseName: row.exerciseName,
      primaryMuscle: row.primaryMuscle,
      secondaryMuscle: row.secondaryMuscle,
      videoUrl: row.videoUrl,
      repsScheme: row.repsScheme,
      weightKg: row.weightKg,
      intensity: row.intensity,
      tempo: row.tempo,
      sets: row.sets,
      reps: row.reps,
      durationSecs: row.durationSecs,
      restSecs: row.restSecs,
      trainerNotes: row.trainerNotes,
      groupLabel: row.groupLabel,
      groupRestSecs: row.groupRestSecs,
    })

    if (row.studentDni) {
      template.dnis.add(row.studentDni)
      const rows = dniRows.get(row.studentDni) ?? []
      rows.push(rowNumber)
      dniRows.set(row.studentDni, rows)
    }
  })

  if (rowErrors.length === 0 && templates.size > 0) {
    const allExerciseNames = new Set<string>()
    for (const tpl of templates.values()) {
      for (const day of tpl.days.values()) {
        for (const block of day.blocks) allExerciseNames.add(block.exerciseName)
      }
    }

    const refs = await checkRoutineImportRefsAction({
      exerciseNames: [...allExerciseNames],
      studentDnis: [...dniRows.keys()],
    })

    const existingSet = new Set(refs.existingExerciseNames)
    for (const name of allExerciseNames) {
      if (!existingSet.has(name) && !exerciseMeta.get(name)?.primaryMuscle) {
        rowErrors.push({
          row: 0,
          message: `Ejercicio nuevo "${name}" requiere primaryMuscle en al menos una fila`,
        })
      }
    }

    for (const dni of refs.missingDnis) {
      for (const row of dniRows.get(dni) ?? []) {
        rowErrors.push({ row, message: `DNI ${dni} no está registrado o está inactivo` })
      }
    }
  }

  return { errors: rowErrors, units: buildTemplateUnits(templates, exerciseMeta) }
}

export function RoutineImportRunner() {
  return (
    <ImportRunner<TemplateImportUnit, ImportRoutinesChunkResult>
      validate={validateTemplatesFile}
      importChunk={importRoutineTemplatesChunkAction}
      combineResults={(acc, next) => ({
        succeeded: [...acc.succeeded, ...next.succeeded],
        failed: [...acc.failed, ...next.failed],
        assignmentWarnings: [...acc.assignmentWarnings, ...next.assignmentWarnings],
      })}
      initialResult={{ succeeded: [], failed: [], assignmentWarnings: [] }}
      confirmTriggerLabel={(units) => {
        const totalAssignments = units.reduce((sum, u) => sum + u.studentDnis.length, 0)
        return (
          <>
            Importar {units.length} plantilla(s)
            {totalAssignments > 0 && ` / ${totalAssignments} asignación(es)`}
          </>
        )
      }}
      confirmTitle={(units) => `¿Importar ${units.length} plantilla(s)?`}
      confirmDescription={(units) => {
        const totalAssignments = units.reduce((sum, u) => sum + u.studentDnis.length, 0)
        return (
          <>
            Se crean los ejercicios nuevos, las plantillas con sus días/bloques
            {totalAssignments > 0 &&
              `, y se asignan ${totalAssignments} rutina(s) a alumnos (reemplazando su rutina activa)`}
            . Esta acción no se puede deshacer.
          </>
        )
      }}
      progressLabel={(processed, total) => `Importando... ${processed}/${total} plantilla(s)`}
      renderReport={(report, reset) => (
        <div className="rounded-md border p-4">
          <p className="font-medium">
            {report.succeeded.length} plantilla(s) importada(s) / {report.failed.length} omitida(s)
          </p>
          {report.failed.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 text-sm text-destructive">
              {report.failed.map((f, i) => (
                <li key={i}>
                  {f.templateName}: {f.error}
                </li>
              ))}
            </ul>
          )}
          {report.assignmentWarnings.length > 0 && (
            <>
              <p className="mt-3 text-sm font-medium">Asignaciones no completadas:</p>
              <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                {report.assignmentWarnings.map((w, i) => (
                  <li key={i}>
                    {w.templateName} → DNI {w.dni}: {w.error}
                  </li>
                ))}
              </ul>
            </>
          )}
          <Button variant="secondary" className="mt-4" onClick={reset}>
            Importar otro archivo
          </Button>
        </div>
      )}
    />
  )
}
