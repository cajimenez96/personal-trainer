import Link from "next/link"
import { redirect } from "next/navigation"
import { ExerciseProgress } from "@/components/portal/exercise-progress"
import { studentService } from "@/lib/services/student.service"
import { assignedRoutineService } from "@/lib/services/assigned-routine.service"
import { progressLogService } from "@/lib/services/progress-log.service"
import { dniSchema } from "@/lib/validators/portal"

// Stateless by design — every visit re-validates the DNI and re-reads the
// student's current active routine. Never cache across requests.
export const dynamic = "force-dynamic"

export default async function RutinaPage({
  params,
}: {
  params: Promise<{ dni: string }>
}) {
  const { dni: rawDni } = await params

  const parsed = dniSchema.safeParse(rawDni)
  if (!parsed.success) redirect("/?error=invalid")

  const student = await studentService.getByDni(parsed.data)
  if (!student || !student.isActive) redirect("/?error=not-found")

  const activeRoutine = await assignedRoutineService.getActiveByStudentId(student.id)

  if (!activeRoutine) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <p className="text-lg font-semibold">
          Hola, {student.firstName}
        </p>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Todavía no tenés una rutina activa. Consultá con tu entrenador para que te
          asigne una.
        </p>
        <Link href="/" className="mt-6 text-sm text-primary hover:underline">
          Volver a ingresar DNI
        </Link>
      </div>
    )
  }

  const routine = await assignedRoutineService.getDetail(activeRoutine.id)
  if (!routine) redirect("/?error=not-found")

  const todayProgress = await progressLogService.getForToday(student.id)
  const progressByBlock = new Map(todayProgress.map((p) => [p.exerciseBlockId, p]))

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="border-b bg-card px-4 py-5">
        <p className="text-sm text-muted-foreground">Hola,</p>
        <h1 className="text-2xl font-bold">{student.firstName} {student.lastName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{routine.templateName}</p>
      </header>

      <main className="flex flex-col gap-3 px-4 py-4">
        {routine.days.length === 0 && (
          <p className="text-center text-muted-foreground">
            Esta rutina todavía no tiene días cargados.
          </p>
        )}

        {routine.days.map((day, index) => (
          <details
            key={day.id}
            open={index === 0}
            className="rounded-2xl border bg-card open:pb-2"
          >
            <summary className="flex min-h-11 cursor-pointer items-center px-4 py-3 text-lg font-semibold">
              {day.label}
            </summary>

            <div className="flex flex-col gap-3 px-4 pb-2">
              {day.blocks.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin ejercicios.</p>
              )}
              {day.blocks.map((block) => (
                <div key={block.id} className="rounded-xl border bg-background p-4">
                  <p className="text-base font-semibold">{block.exerciseName}</p>
                  <p className="mt-1 text-sm text-foreground">
                    {block.sets} series
                    {block.reps ? ` × ${block.reps} reps` : ""}
                    {block.durationSecs ? ` · ${block.durationSecs}s` : ""}
                  </p>
                  {block.restSecs !== null && (
                    <p className="text-sm text-muted-foreground">
                      Descanso: {block.restSecs}s
                    </p>
                  )}
                  {block.trainerNotes && (
                    <p className="mt-2 text-sm italic text-muted-foreground">
                      "{block.trainerNotes}"
                    </p>
                  )}
                  {block.exerciseVideoUrl && (
                    <a
                      href={block.exerciseVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary"
                    >
                      Ver video ↗
                    </a>
                  )}

                  <ExerciseProgress
                    dni={parsed.data}
                    assignedRoutineId={routine.id}
                    exerciseBlockId={block.id}
                    initialCompleted={progressByBlock.get(block.id)?.completed ?? false}
                    initialWeightKg={progressByBlock.get(block.id)?.weightKg ?? null}
                    initialNotes={progressByBlock.get(block.id)?.studentNotes ?? null}
                  />
                </div>
              ))}
            </div>
          </details>
        ))}
      </main>
    </div>
  )
}
