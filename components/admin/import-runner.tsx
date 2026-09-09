"use client"

import { useRef, useState, type ReactNode } from "react"
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

export type RowError = { row: number; message: string }

const DEFAULT_CHUNK_SIZE = 50

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

type ImportRunnerProps<TUnit, TResult> = {
  chunkSize?: number
  // Parses + validates the raw file into importable units. Each caller owns its
  // own CSV shape (flat row -> entity, or many rows grouped into one entity).
  validate: (file: File) => Promise<{ errors: RowError[]; units: TUnit[] }>
  importChunk: (batch: TUnit[]) => Promise<TResult>
  combineResults: (acc: TResult, next: TResult) => TResult
  initialResult: TResult
  confirmTriggerLabel: (units: TUnit[]) => ReactNode
  confirmTitle: (units: TUnit[]) => ReactNode
  confirmDescription: (units: TUnit[]) => ReactNode
  progressLabel: (processed: number, total: number) => ReactNode
  renderReport: (result: TResult, reset: () => void) => ReactNode
}

export function ImportRunner<TUnit, TResult>({
  chunkSize = DEFAULT_CHUNK_SIZE,
  validate,
  importChunk,
  combineResults,
  initialResult,
  confirmTriggerLabel,
  confirmTitle,
  confirmDescription,
  progressLabel,
  renderReport,
}: ImportRunnerProps<TUnit, TResult>) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [inputKey, setInputKey] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<"idle" | "validating" | "invalid" | "ready" | "importing">(
    "idle",
  )
  const [errors, setErrors] = useState<RowError[]>([])
  const [units, setUnits] = useState<TUnit[]>([])
  const [processed, setProcessed] = useState(0)
  const [report, setReport] = useState<TResult | null>(null)

  function reset() {
    setSelectedFile(null)
    setStatus("idle")
    setErrors([])
    setUnits([])
    setProcessed(0)
    setReport(null)
    setInputKey((k) => k + 1)
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

    const { errors: rowErrors, units: parsedUnits } = await validate(selectedFile)

    setErrors(rowErrors.sort((a, b) => a.row - b.row))
    if (rowErrors.length > 0) {
      setStatus("invalid")
      setUnits([])
    } else {
      setUnits(parsedUnits)
      setStatus("ready")
    }
  }

  async function handleImport() {
    setStatus("importing")
    setProcessed(0)
    let result = initialResult

    for (const batch of chunk(units, chunkSize)) {
      const batchResult = await importChunk(batch)
      result = combineResults(result, batchResult)
      setProcessed((p) => p + batch.length)
    }

    setReport(result)
  }

  if (report) return <>{renderReport(report, reset)}</>

  if (status === "importing") {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        {progressLabel(processed, units.length)}
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
          key={inputKey}
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
              <li key={i}>{e.row > 0 ? `Fila ${e.row}: ${e.message}` : e.message}</li>
            ))}
          </ul>
        </div>
      )}

      {status === "ready" && (
        <AlertDialog>
          <AlertDialogTrigger render={<Button />}>{confirmTriggerLabel(units)}</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmTitle(units)}</AlertDialogTitle>
              <AlertDialogDescription>{confirmDescription(units)}</AlertDialogDescription>
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
