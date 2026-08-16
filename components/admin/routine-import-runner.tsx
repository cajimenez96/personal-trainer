"use client"

import { useRef, useState } from "react"
import Papa from "papaparse"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { routineImportRowSchema } from "@/lib/validators/routine-import"
import {
  checkRoutineImportRefsAction,
  importRoutineTemplatesChunkAction,
  type ImportRoutinesChunkResult,
  type TemplateImportUnit,
} from "@/lib/actions/routine-import.actions"

const CHUNK_SIZE = 50
const DEFAULT_DURATION_WEEKS = 4

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

type RowError = { row: number; message: string }

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

export function RoutineImportRunner() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "validating" | "invalid" | "ready" | "importing">(
    "idle",
  )
  const [errors, setErrors] = useState<RowError[]>([])
  const [templateUnits, setTemplateUnits] = useState<TemplateImportUnit[]>([])
  const [processed, setProcessed] = useState(0)
  const [report, setReport] = useState<ImportRoutinesChunkResult | null>(null)

  const totalAssignments = templateUnits.reduce((sum, t) => sum + t.studentDnis.length, 0)

  function reset() {
    setFileName(null)
    setStatus("idle")
    setErrors([])
    setTemplateUnits([])
    setProcessed(0)
    setReport(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setStatus("validating")
    setReport(null)

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

    setErrors(rowErrors.sort((a, b) => a.row - b.row))
    if (rowErrors.length > 0) {
      setStatus("invalid")
      setTemplateUnits([])
    } else {
      setTemplateUnits(buildTemplateUnits(templates, exerciseMeta))
      setStatus("ready")
    }
  }

  async function handleImport() {
    setStatus("importing")
    setProcessed(0)
    const succeeded: string[] = []
    const failed: ImportRoutinesChunkResult["failed"] = []
    const assignmentWarnings: ImportRoutinesChunkResult["assignmentWarnings"] = []

    for (const batch of chunk(templateUnits, CHUNK_SIZE)) {
      const result = await importRoutineTemplatesChunkAction(batch)
      succeeded.push(...result.succeeded)
      failed.push(...result.failed)
      assignmentWarnings.push(...result.assignmentWarnings)
      setProcessed((p) => p + batch.length)
    }

    setReport({ succeeded, failed, assignmentWarnings })
  }

  if (report) {
    return (
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
    )
  }

  if (status === "importing") {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        Importando... {processed}/{templateUnits.length} plantilla(s)
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="text-sm"
        />
        {fileName && <p className="text-sm text-muted-foreground">Archivo: {fileName}</p>}
      </div>

      {status === "validating" && (
        <p className="text-sm text-muted-foreground">Validando archivo...</p>
      )}

      {status === "invalid" && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
          <p className="font-medium text-destructive">
            El archivo tiene {errors.length} error(es) — no se importó nada.
          </p>
          <ul className="mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto text-sm text-destructive">
            {errors.map((e, i) => (
              <li key={i}>{e.row > 0 ? `Fila ${e.row}: ${e.message}` : e.message}</li>
            ))}
          </ul>
          <Button variant="secondary" className="mt-4" onClick={reset}>
            Elegir otro archivo
          </Button>
        </div>
      )}

      {status === "ready" && (
        <AlertDialog>
          <AlertDialogTrigger render={<Button />}>
            Importar {templateUnits.length} plantilla(s)
            {totalAssignments > 0 && ` / ${totalAssignments} asignación(es)`}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                ¿Importar {templateUnits.length} plantilla(s)?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Se crean los ejercicios nuevos, las plantillas con sus días/bloques
                {totalAssignments > 0 &&
                  `, y se asignan ${totalAssignments} rutina(s) a alumnos (reemplazando su rutina activa)`}
                . Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleImport}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
