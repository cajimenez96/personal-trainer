"use client"

import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { ImportRunner, type RowError } from "@/components/admin/import-runner"
import { createStudentSchema, type CreateStudentInput } from "@/lib/validators/student"
import {
  checkExistingDnisAction,
  getStudentImportRefsAction,
  importStudentsChunkAction,
  type ImportStudentsChunkResult,
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

async function validateStudentsFile(
  file: File,
): Promise<{ errors: RowError[]; units: CreateStudentInput[] }> {
  const { data } = Papa.parse<Record<string, string>>(await file.text(), {
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

  return { errors: rowErrors, units: parsedRows }
}

export function StudentImportRunner() {
  return (
    <ImportRunner<CreateStudentInput, ImportStudentsChunkResult>
      validate={validateStudentsFile}
      importChunk={importStudentsChunkAction}
      combineResults={(acc, next) => ({
        succeeded: [...acc.succeeded, ...next.succeeded],
        failed: [...acc.failed, ...next.failed],
      })}
      initialResult={{ succeeded: [], failed: [] }}
      confirmTriggerLabel={(units) => `Importar ${units.length} alumno(s)`}
      confirmTitle={(units) => `¿Importar ${units.length} alumno(s)?`}
      confirmDescription={() =>
        "El archivo pasó todas las validaciones. Esta acción crea los alumnos en el sistema y no se puede deshacer."
      }
      progressLabel={(processed, total) => `Importando... ${processed}/${total}`}
      renderReport={(report, reset) => (
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
      )}
    />
  )
}
