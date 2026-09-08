import type { RoutineTemplateWithFullDays } from "@/lib/repositories/interfaces"
import type { RoutineDetailDay } from "@/lib/services/assigned-routine.service"

// No AssignedRoutine/override involved: a generic profile's routine is
// always exactly what the template says (RN-02 override rules don't apply).
export function mapTemplateToRoutineDays(
  template: RoutineTemplateWithFullDays,
  exerciseById: Map<string, { name: string; videoUrl: string | null }>,
): RoutineDetailDay[] {
  return template.trainingDays.map((day) => ({
    id: day.id,
    label: day.label,
    blocks: day.exerciseBlocks.map((block) => {
      const exercise = exerciseById.get(block.exerciseId)
      return {
        id: block.id,
        exerciseName: exercise?.name ?? "Ejercicio",
        exerciseVideoUrl: exercise?.videoUrl ?? null,
        sets: block.sets,
        reps: block.reps,
        repsScheme: block.repsScheme,
        weightKg: block.weightKg,
        intensity: block.intensity,
        tempo: block.tempo,
        durationSecs: block.durationSecs,
        restSecs: block.restSecs,
        trainerNotes: block.trainerNotes,
        isOverridden: false,
        groupLabel: block.groupLabel,
        groupRestSecs: block.groupRestSecs,
      }
    }),
  }))
}
