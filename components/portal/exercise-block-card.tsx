import type { ReactNode } from "react"
import { Play } from "lucide-react"
import { VideoDialog } from "@/components/shared/video-dialog"
import type { RoutineDetailBlock } from "@/lib/services/assigned-routine.service"

export function ExerciseBlockCard({
  block,
  trailingSlot,
}: {
  block: RoutineDetailBlock
  trailingSlot?: ReactNode
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
          {block.repsScheme ? block.repsScheme : block.reps ? block.reps : "—"}
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

      {trailingSlot}
    </div>
  )
}
