import Link from "next/link"
import { redirect } from "next/navigation"
import { ExerciseProgress } from "@/components/portal/exercise-progress"
import { BodyWeightInput } from "@/components/portal/body-weight-input"
import { VideoDialog } from "@/components/shared/video-dialog"
import { studentService } from "@/lib/services/student.service"
import { assignedRoutineService } from "@/lib/services/assigned-routine.service"
import { progressLogService } from "@/lib/services/progress-log.service"
import { bodyWeightService } from "@/lib/services/body-weight.service"
import { dniSchema } from "@/lib/validators/portal"
import { groupConsecutiveBlocks } from "@/lib/utils/group-blocks"
import type { RoutineDetailBlock } from "@/lib/services/assigned-routine.service"
import type { ProgressLogEntry } from "@/lib/repositories/interfaces"

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

  const [todayProgress, todayBodyWeight] = await Promise.all([
    progressLogService.getForToday(student.id),
    bodyWeightService.getForToday(student.id),
  ])
  const progressByBlock = new Map(todayProgress.map((p) => [p.exerciseBlockId, p]))

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="bg-[#0d0d0d] px-4 py-5 text-white">
        <p className="text-sm text-white/60">Hola,</p>
        <h1 className="font-heading text-2xl font-semibold">{student.firstName} {student.lastName}</h1>
        <p className="mt-1 text-sm text-white/60">{routine.templateName}</p>
        <BodyWeightInput dni={parsed.data} initialWeightKg={todayBodyWeight?.weightKg ?? null} />
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
              {groupConsecutiveBlocks(day.blocks).map((entry, entryIndex) =>
                entry.kind === "single" ? (
                  <ExerciseBlockCard
                    key={entry.block.id}
                    block={entry.block}
                    dni={parsed.data}
                    assignedRoutineId={routine.id}
                    progressByBlock={progressByBlock}
                  />
                ) : (
                  <div
                    key={`group-${entryIndex}-${entry.label}`}
                    className="rounded-xl border-2 border-primary/40 bg-primary/5 p-3"
                  >
                    <p className="mb-2 text-sm font-semibold text-primary">
                      Bloque {entry.label} · superserie
                    </p>
                    <div className="flex flex-col gap-3">
                      {entry.blocks.map((block) => (
                        <ExerciseBlockCard
                          key={block.id}
                          block={block}
                          dni={parsed.data}
                          assignedRoutineId={routine.id}
                          progressByBlock={progressByBlock}
                        />
                      ))}
                    </div>
                    {entry.blocks[entry.blocks.length - 1].groupRestSecs !== null && (
                      <p className="mt-2 text-sm font-medium text-muted-foreground">
                        Descanso post-bloque:{" "}
                        {entry.blocks[entry.blocks.length - 1].groupRestSecs}s
                      </p>
                    )}
                  </div>
                ),
              )}
            </div>
          </details>
        ))}
      </main>
    </div>
  )
}

function ExerciseBlockCard({
  block,
  dni,
  assignedRoutineId,
  progressByBlock,
}: {
  block: RoutineDetailBlock
  dni: string
  assignedRoutineId: string
  progressByBlock: Map<string, ProgressLogEntry>
}) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-base font-semibold">{block.exerciseName}</p>
      <p className="mt-1 text-sm text-foreground">
        {block.sets} series
        {block.repsScheme
          ? ` (${block.repsScheme})`
          : block.reps
            ? ` × ${block.reps} reps`
            : ""}
        {block.durationSecs ? ` · ${block.durationSecs}s` : ""}
      </p>
      {(block.weightKg !== null || block.intensity !== null) && (
        <p className="text-sm font-medium text-primary">
          {block.weightKg !== null && `${block.weightKg} kg`}
          {block.weightKg !== null && block.intensity !== null && " · "}
          {block.intensity !== null && block.intensity}
        </p>
      )}
      {block.tempo !== null && (
        <p className="text-sm text-muted-foreground">Tempo: {block.tempo}</p>
      )}
      {block.restSecs !== null && (
        <p className="text-sm text-muted-foreground">Descanso: {block.restSecs}s</p>
      )}
      {block.trainerNotes && (
        <p className="mt-2 text-sm italic text-muted-foreground">"{block.trainerNotes}"</p>
      )}
      {block.exerciseVideoUrl && (
        <VideoDialog
          videoUrl={block.exerciseVideoUrl}
          className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary"
        >
          Ver video ↗
        </VideoDialog>
      )}

      <ExerciseProgress
        dni={dni}
        assignedRoutineId={assignedRoutineId}
        exerciseBlockId={block.id}
        initialCompleted={progressByBlock.get(block.id)?.completed ?? false}
        initialWeightKg={progressByBlock.get(block.id)?.weightKg ?? null}
        initialNotes={progressByBlock.get(block.id)?.studentNotes ?? null}
        initialNoteType={progressByBlock.get(block.id)?.noteType ?? null}
        restSecs={block.restSecs}
      />
    </div>
  )
}
