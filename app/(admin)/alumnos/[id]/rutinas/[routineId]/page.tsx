import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { studentService } from "@/lib/services/student.service"
import { assignedRoutineService } from "@/lib/services/assigned-routine.service"

// DB-backed, must reflect the latest overrides/status on every visit.
export const dynamic = "force-dynamic"

export default async function RutinaDetallePage({
  params,
}: {
  params: Promise<{ id: string; routineId: string }>
}) {
  const { id, routineId } = await params

  const [student, routine] = await Promise.all([
    studentService.getById(id),
    assignedRoutineService.getDetail(routineId),
  ])

  if (!student || !routine || routine.studentId !== id) notFound()

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{routine.templateName}</h1>
          <p className="text-muted-foreground">
            {student.firstName} {student.lastName} ·{" "}
            {new Intl.DateTimeFormat("es-AR").format(routine.assignedAt)}
            {routine.expiresAt &&
              ` · vence ${new Intl.DateTimeFormat("es-AR").format(routine.expiresAt)}`}
          </p>
        </div>
        <Badge variant={routine.status === "active" ? "default" : "secondary"}>
          {routine.status === "active" ? "Activa" : "Histórico"}
        </Badge>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Vista de solo lectura. Los ejercicios marcados "personalizado" tienen valores
        distintos a los de la plantilla base.
      </p>

      {routine.days.length === 0 && (
        <p className="text-muted-foreground">Esta rutina no tiene días cargados.</p>
      )}

      <div className="flex flex-col gap-4">
        {routine.days.map((day) => (
          <Card key={day.id}>
            <CardHeader>
              <CardTitle className="text-base">{day.label}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {day.blocks.map((block) => (
                <div key={block.id} className="rounded-md border p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium">{block.exerciseName}</span>
                    {block.isOverridden && (
                      <Badge variant="outline" className="text-xs">
                        Personalizado
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    {block.sets} series
                    {block.reps ? ` × ${block.reps} reps` : ""}
                    {block.durationSecs ? ` · ${block.durationSecs}s` : ""}
                    {block.restSecs ? ` · descanso ${block.restSecs}s` : ""}
                  </p>
                  {block.trainerNotes && (
                    <p className="mt-1 italic text-muted-foreground">"{block.trainerNotes}"</p>
                  )}
                  {block.exerciseVideoUrl && (
                    <Link
                      href={block.exerciseVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-primary hover:underline"
                    >
                      Ver video
                    </Link>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
