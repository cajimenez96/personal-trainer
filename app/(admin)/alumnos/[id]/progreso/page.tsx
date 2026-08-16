import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { studentService } from "@/lib/services/student.service"
import { progressLogService } from "@/lib/services/progress-log.service"
import { progressHistoryQuerySchema } from "@/lib/validators/progress-history"
import { NOTE_TYPE_VALUES, type NoteType } from "@/lib/validators/progress-note"
import type { ProgressHistoryEntry } from "@/lib/repositories/interfaces"

export const dynamic = "force-dynamic"

const NOTE_TYPE_LABEL: Record<NoteType, string> = {
  session: "Sesión normal",
  incident: "Incidencia",
  discomfort: "Molestia",
}

const NOTE_TYPE_BADGE_VARIANT: Record<NoteType, "secondary" | "destructive"> = {
  session: "secondary",
  incident: "destructive",
  discomfort: "destructive",
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "full" }).format(date)
}

function toDateInputValue(date: Date | undefined) {
  if (!date) return ""
  return date.toISOString().slice(0, 10)
}

function groupByDate(entries: ProgressHistoryEntry[]) {
  const groups = new Map<string, ProgressHistoryEntry[]>()
  for (const entry of entries) {
    const key = entry.loggedDate.toISOString().slice(0, 10)
    const bucket = groups.get(key)
    if (bucket) bucket.push(entry)
    else groups.set(key, [entry])
  }
  return [...groups.entries()].map(([key, items]) => ({
    date: items[0].loggedDate,
    key,
    items,
  }))
}

export default async function AlumnoProgresoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { id } = await params
  const student = await studentService.getById(id)
  if (!student) notFound()

  const rawQuery = await searchParams
  const parsedQuery = progressHistoryQuerySchema.safeParse(rawQuery)
  const filters = parsedQuery.success ? parsedQuery.data : {}

  const entries = await progressLogService.getHistory(id, filters)
  const sessions = groupByDate(entries)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Progreso de {student.firstName} {student.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Historial de sesiones registradas por el alumno.
          </p>
        </div>
        <Button variant="outline" render={<Link href={`/alumnos/${id}`} />}>
          Volver a la ficha
        </Button>
      </div>

      <form className="mb-6 flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1">
          <Label htmlFor="from">Desde</Label>
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={toDateInputValue(filters.from)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="to">Hasta</Label>
          <Input id="to" name="to" type="date" defaultValue={toDateInputValue(filters.to)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="noteType">Tipo de nota</Label>
          <select
            id="noteType"
            name="noteType"
            defaultValue={filters.noteType ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Todos</option>
            {NOTE_TYPE_VALUES.map((value) => (
              <option key={value} value={value}>
                {NOTE_TYPE_LABEL[value]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        {(filters.from || filters.to || filters.noteType) && (
          <Button variant="ghost" render={<Link href={`/alumnos/${id}/progreso`} />}>
            Limpiar
          </Button>
        )}
      </form>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay sesiones registradas en este rango.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {sessions.map((session) => (
            <div key={session.key} className="rounded-lg border p-4">
              <p className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {formatDate(session.date)}
              </p>
              <ul className="flex flex-col gap-2">
                {session.items.map((item) => (
                  <li
                    key={item.exerciseBlockId}
                    className="flex flex-col gap-1 rounded-md bg-muted/50 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{item.exerciseName}</span>
                      <div className="flex gap-1">
                        {item.noteType && (
                          <Badge variant={NOTE_TYPE_BADGE_VARIANT[item.noteType]}>
                            {NOTE_TYPE_LABEL[item.noteType]}
                          </Badge>
                        )}
                        <Badge variant={item.completed ? "success" : "secondary"}>
                          {item.completed ? "Completado" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                    {item.weightKg !== null && (
                      <p className="text-muted-foreground">Peso: {item.weightKg} kg</p>
                    )}
                    {item.studentNotes && (
                      <p className="italic text-muted-foreground">"{item.studentNotes}"</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
