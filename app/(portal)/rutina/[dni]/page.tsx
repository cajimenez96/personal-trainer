import Link from "next/link"
import { redirect } from "next/navigation"
import { Play, ChevronDown } from "lucide-react"
import { ExerciseProgress } from "@/components/portal/exercise-progress"
import { BodyWeightInput } from "@/components/portal/body-weight-input"
import { DayWeightsDialogs } from "@/components/portal/day-weights-dialog"
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
    <div className="min-h-screen bg-[#efefef] pb-12 dark:bg-background">
      <header className="bg-[#0d0d0d] px-4 py-5 text-white">
        <p className="text-sm text-white/60">Hola,</p>
        <h1 className="font-heading text-2xl font-semibold">{student.firstName} {student.lastName}</h1>
        <p className="mt-1 text-sm text-white/60">{routine.templateName}</p>
        <BodyWeightInput dni={parsed.data} initialWeightKg={todayBodyWeight?.weightKg ?? null} />
      </header>

      <main className="flex flex-col gap-3 px-3 py-4 sm:px-4">
        {routine.days.length === 0 && (
          <p className="text-center text-muted-foreground">
            Esta rutina todavía no tiene días cargados.
          </p>
        )}

        {routine.days.map((day) => (
          <details
            key={day.id}
            className="group rounded-2xl border border-border/80 bg-card shadow-sm transition-all open:pb-3"
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 py-3.5 text-base font-bold text-[#d32f2f] hover:opacity-90 dark:text-red-400 [&::-webkit-details-marker]:hidden">
              <span className="font-heading text-lg tracking-tight">
                {day.label}
              </span>
              <ChevronDown className="size-5 transition-transform duration-200 group-open:rotate-180" />
            </summary>

            <div className="flex flex-col gap-3 px-4 pt-1">
              {/* Botones de acción del día */}
              {day.blocks.length > 0 && (
                <DayWeightsDialogs
                  dni={parsed.data}
                  assignedRoutineId={routine.id}
                  blocks={day.blocks}
                  progressByBlock={progressByBlock}
                />
              )}

              {day.blocks.length === 0 && (
                <p className="py-2 text-sm text-muted-foreground">Sin ejercicios.</p>
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
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-lg font-bold leading-snug tracking-tight text-foreground">
          {block.exerciseName}
        </h3>
        {block.exerciseVideoUrl && (
          <VideoDialog
            videoUrl={block.exerciseVideoUrl}
            className="flex h-9 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e5252a] text-white shadow-sm transition-transform hover:bg-[#c91e23] active:scale-95"
          >
            <Play className="size-4 fill-white text-white" />
          </VideoDialog>
        )}
      </div>

      <div className="mt-2.5 flex flex-col gap-1 text-sm">
        <p className="text-foreground">
          <span className="font-bold">Series:</span> {block.sets}
        </p>
        <p className="text-foreground">
          <span className="font-bold">Repeticiones:</span>{" "}
          {block.repsScheme
            ? block.repsScheme
            : block.reps
              ? block.reps
              : "—"}
          {block.durationSecs ? ` · ${block.durationSecs}s` : ""}
        </p>
        {block.restSecs !== null && (
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Descanso:</span> {block.restSecs}s
          </p>
        )}
        {(block.weightKg !== null || block.intensity !== null) && (
          <p className="text-sm font-medium text-primary">
            {block.weightKg !== null && `Carga sugerida: ${block.weightKg} kg`}
            {block.weightKg !== null && block.intensity !== null && " · "}
            {block.intensity !== null && block.intensity}
          </p>
        )}
        {block.tempo !== null && (
          <p className="text-xs text-muted-foreground">Tempo: {block.tempo}</p>
        )}
        {block.trainerNotes && (
          <p className="mt-1 text-xs italic text-muted-foreground">
            &ldquo;{block.trainerNotes}&rdquo;
          </p>
        )}
      </div>

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
