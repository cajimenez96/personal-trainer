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
import { createStudentSchema, type CreateStudentInput } from "@/lib/validators/student"
import {
  checkExistingDnisAction,
  importStudentsChunkAction,
} from "@/lib/actions/student-import.actions"

const CHUNK_SIZE = 50

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

type RowError = { row: number; message: string }
type ImportReport = { succeeded: string[]; failed: { dni: string; error: string }[] }

export function StudentImportRunner() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "validating" | "invalid" | "ready" | "importing">(
    "idle",
  )
  const [errors, setErrors] = useState<RowError[]>([])
  const [validRows, setValidRows] = useState<CreateStudentInput[]>([])
  const [processed, setProcessed] = useState(0)
  const [report, setReport] = useState<ImportReport | null>(null)

  function reset() {
    setFileName(null)
    setStatus("idle")
    setErrors([])
    setValidRows([])
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
    const seenDnis = new Map<string, number>()
    const parsedRows: CreateStudentInput[] = []

    data.forEach((raw, index) => {
      const rowNumber = index + 2 // +1 for 0-index, +1 for the header row
      const parsed = createStudentSchema.safeParse(raw)

      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          rowErrors.push({ row: rowNumber, message: `${issue.path.join(".")}: ${issue.message}` })
        }
        return
      }

      const previousRow = seenDnis.get(parsed.data.dni)
      if (previousRow !== undefined) {
        rowErrors.push({
          row: rowNumber,
          message: `DNI duplicado en el archivo (ya aparece en la fila ${previousRow})`,
        })
        return
      }

      seenDnis.set(parsed.data.dni, rowNumber)
      parsedRows.push(parsed.data)
    })

    if (rowErrors.length === 0 && parsedRows.length > 0) {
      const existingDnis = await checkExistingDnisAction(parsedRows.map((r) => r.dni))
      if (existingDnis.length > 0) {
        const existingSet = new Set(existingDnis)
        parsedRows.forEach((row, i) => {
          if (existingSet.has(row.dni)) {
            rowErrors.push({
              row: i + 2,
              message: `Ya existe un alumno con DNI ${row.dni} en el sistema`,
            })
          }
        })
      }
    }

    setErrors(rowErrors.sort((a, b) => a.row - b.row))
    if (rowErrors.length > 0) {
      setStatus("invalid")
      setValidRows([])
    } else {
      setValidRows(parsedRows)
      setStatus("ready")
    }
  }

  async function handleImport() {
    setStatus("importing")
    setProcessed(0)
    const succeeded: string[] = []
    const failed: { dni: string; error: string }[] = []

    for (const batch of chunk(validRows, CHUNK_SIZE)) {
      const result = await importStudentsChunkAction(batch)
      succeeded.push(...result.succeeded)
      failed.push(...result.failed)
      setProcessed((p) => p + batch.length)
    }

    setReport({ succeeded, failed })
  }

  if (report) {
    return (
      <div className="rounded-md border p-4">
        <p className="font-medium">
          {report.succeeded.length} alumno(s) importado(s) / {report.failed.length} omitido(s)
        </p>
        {report.failed.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1 text-sm text-destructive">
            {report.failed.map((f) => (
              <li key={f.dni}>
                DNI {f.dni}: {f.error}
              </li>
            ))}
          </ul>
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
        Importando... {processed}/{validRows.length}
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
              <li key={i}>
                Fila {e.row}: {e.message}
              </li>
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
            Importar {validRows.length} alumno(s)
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Importar {validRows.length} alumno(s)?</AlertDialogTitle>
              <AlertDialogDescription>
                El archivo pasó todas las validaciones. Esta acción crea los alumnos en el
                sistema y no se puede deshacer.
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
