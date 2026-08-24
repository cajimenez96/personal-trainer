"use client"

import { useRef, useState } from "react"
import Papa from "papaparse"
import { Upload, X } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { createStudentSchema, type CreateStudentInput } from "@/lib/validators/student"
import {
  checkExistingDnisAction,
  getStudentImportRefsAction,
  importStudentsChunkAction,
} from "@/lib/actions/student-import.actions"

function toLabelMap(items: { id: string; label: string }[]) {
  return new Map(items.map((item) => [item.label.trim().toLowerCase(), item.id]))
}

// El CSV se pide en español para que quien lo llene no tenga que conocer los
// nombres de campo internos — se traduce acá, una sola vez, antes de validar
// con el mismo schema que ya usa el formulario web (que sigue en inglés).
const CSV_HEADER_MAP: Record<string, string> = {
  dni: "dni",
  nombre: "firstName",
  apellido: "lastName",
  email: "email",
  telefono: "phone",
  objetivo: "objetivo",
  nivel: "nivel",
  modalidad: "modalidad",
  fecha_inicio_membresia: "membershipStartsAt",
  fecha_vencimiento_cuota: "paymentExpiresAt",
  notas_salud: "healthNotes",
}

const DATE_FIELDS = ["membershipStartsAt", "paymentExpiresAt"] as const

// El Excel/CSV usa DD-MM-YYYY (formato que la mayoría maneja de memoria) —
// se convierte a ISO acá antes de validar, el <input type="date"> del
// formulario web sigue mandando YYYY-MM-DD nativamente y no se toca.
function ddmmyyyyToIso(value: string): string | null {
  const match = value.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (!match) return null
  const [, day, month, year] = match
  if (Number(day) < 1 || Number(day) > 31 || Number(month) < 1 || Number(month) > 12) return null
  return `${year}-${month}-${day}`
}

function remapRow(raw: Record<string, string>): Record<string, string> {
  const remapped: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    const field = CSV_HEADER_MAP[key.trim().toLowerCase()] ?? key
    remapped[field] = value
  }
  return remapped
}

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<"idle" | "validating" | "invalid" | "ready" | "importing">(
    "idle",
  )
  const [errors, setErrors] = useState<RowError[]>([])
  const [validRows, setValidRows] = useState<CreateStudentInput[]>([])
  const [processed, setProcessed] = useState(0)
  const [report, setReport] = useState<ImportReport | null>(null)

  function reset() {
    setSelectedFile(null)
    setStatus("idle")
    setErrors([])
    setValidRows([])
    setProcessed(0)
    setReport(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function selectFile(file: File | undefined) {
    if (!file) return
    setSelectedFile(file)
    setStatus("idle")
    setErrors([])
  }

  async function processFile() {
    if (!selectedFile) return
    setStatus("validating")
    setReport(null)

    const { data } = Papa.parse<Record<string, string>>(await selectedFile.text(), {
      header: true,
      skipEmptyLines: true,
    })

    const { objetivos, modalidades } = await getStudentImportRefsAction()
    const objetivoByLabel = toLabelMap(objetivos)
    const modalidadByLabel = toLabelMap(modalidades)

    const rowErrors: RowError[] = []
    const seenDnis = new Map<string, number>()
    const parsedRows: CreateStudentInput[] = []

    data.forEach((rawSpanish, index) => {
      const rowNumber = index + 2 // +1 for 0-index, +1 for the header row
      const raw = remapRow(rawSpanish)

      // Fechas: DD-MM-YYYY -> ISO antes de tocar el schema.
      let dateError = false
      for (const field of DATE_FIELDS) {
        if (!raw[field]?.trim()) continue
        const iso = ddmmyyyyToIso(raw[field])
        if (!iso) {
          rowErrors.push({
            row: rowNumber,
            message: `${field}: "${raw[field]}" no es una fecha válida (formato esperado DD-MM-YYYY)`,
          })
          dateError = true
          continue
        }
        raw[field] = iso
      }
      if (dateError) return

      // objetivo/modalidad llegan como texto (label) desde el CSV — se
      // resuelven a su id antes de validar con el mismo schema que usa el
      // formulario web, que ya trabaja en términos de id.
      const { objetivo: objetivoLabel, modalidad: modalidadLabel, ...rest } = raw
      const row: Record<string, string> = { ...rest }

      if (objetivoLabel?.trim()) {
        const objetivoId = objetivoByLabel.get(objetivoLabel.trim().toLowerCase())
        if (!objetivoId) {
          rowErrors.push({
            row: rowNumber,
            message: `objetivo: "${objetivoLabel}" no coincide con ninguna opción cargada`,
          })
          return
        }
        row.objetivoId = objetivoId
      }

      if (modalidadLabel?.trim()) {
        const modalidadId = modalidadByLabel.get(modalidadLabel.trim().toLowerCase())
        if (!modalidadId) {
          rowErrors.push({
            row: rowNumber,
            message: `modalidad: "${modalidadLabel}" no coincide con ninguna opción cargada`,
          })
          return
        }
        row.modalidadId = modalidadId
      }

      const parsed = createStudentSchema.safeParse(row)

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
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          selectFile(e.dataTransfer.files?.[0])
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-input hover:bg-muted/50",
        )}
      >
        <Upload className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">Arrastrá tu archivo CSV acá</p>
        <p className="text-xs text-muted-foreground">o hacé click para elegirlo</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => selectFile(e.target.files?.[0])}
          className="hidden"
        />
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between rounded-md border p-3">
          <span className="text-sm">{selectedFile.name}</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={reset}
              aria-label="Quitar archivo"
            >
              <X className="size-4" />
            </Button>
            <Button type="button" onClick={processFile} disabled={status === "validating"}>
              {status === "validating" ? "Validando..." : "Cargar archivo"}
            </Button>
          </div>
        </div>
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
