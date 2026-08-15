"use client"

import { useState } from "react"
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
import { assignRoutineChunkAction } from "@/lib/actions/bulk-assignment.actions"

const CHUNK_SIZE = 50

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

type Report = {
  succeeded: string[]
  failed: { studentId: string; error: string }[]
}

export function BulkAssignRunner({
  templateId,
  templateName,
  students,
}: {
  templateId: string
  templateName: string
  students: { id: string; name: string }[]
}) {
  const [running, setRunning] = useState(false)
  const [processed, setProcessed] = useState(0)
  const [report, setReport] = useState<Report | null>(null)

  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? id

  async function handleConfirm() {
    setRunning(true)
    setProcessed(0)
    const succeeded: string[] = []
    const failed: { studentId: string; error: string }[] = []

    for (const batch of chunk(students.map((s) => s.id), CHUNK_SIZE)) {
      const result = await assignRoutineChunkAction({ templateId, studentIds: batch })
      succeeded.push(...result.succeeded)
      failed.push(...result.failed)
      setProcessed((p) => p + batch.length)
    }

    setReport({ succeeded, failed })
    setRunning(false)
  }

  if (report) {
    return (
      <div className="rounded-md border p-4">
        <p className="font-medium">
          {report.succeeded.length} asignación(es) exitosa(s) / {report.failed.length} error(es)
        </p>
        {report.failed.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1 text-sm text-destructive">
            {report.failed.map((f) => (
              <li key={f.studentId}>
                {studentName(f.studentId)}: {f.error}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  if (running) {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        Asignando... {processed}/{students.length}
      </div>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button disabled={students.length === 0} />}>
        Asignar a {students.length} alumno(s)
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Asignar "{templateName}" a {students.length} alumno(s)?</AlertDialogTitle>
          <AlertDialogDescription>
            Cada alumno que ya tenga una rutina activa la va a perder (pasa a histórico). Esta
            acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
