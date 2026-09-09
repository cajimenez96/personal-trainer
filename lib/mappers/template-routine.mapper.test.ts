import { describe, expect, it } from "vitest"
import { mapTemplateToRoutineDays } from "./template-routine.mapper"
import type { RoutineTemplateWithFullDays } from "@/lib/repositories/interfaces"

function makeTemplate(): RoutineTemplateWithFullDays {
  return {
    id: "template-1",
    name: "Plantilla Básico",
    description: null,
    durationWeeks: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    trainingDays: [
      {
        id: "day-1",
        label: "Día 1",
        dayOrder: 0,
        exerciseBlocks: [
          {
            id: "block-1",
            exerciseId: "exercise-1",
            sets: 3,
            reps: 10,
            repsScheme: null,
            weightKg: 20,
            intensity: null,
            tempo: null,
            durationSecs: null,
            restSecs: 60,
            trainerNotes: null,
            blockOrder: 0,
            groupLabel: null,
            groupRestSecs: null,
          },
        ],
      },
    ],
  }
}

describe("mapTemplateToRoutineDays", () => {
  it("maps template days/blocks into RoutineDetailDay shape, resolving exercise info", () => {
    const exerciseById = new Map([["exercise-1", { name: "Sentadilla", videoUrl: "https://example.com/v" }]])

    const result = mapTemplateToRoutineDays(makeTemplate(), exerciseById)

    expect(result).toEqual([
      {
        id: "day-1",
        label: "Día 1",
        blocks: [
          {
            id: "block-1",
            exerciseName: "Sentadilla",
            exerciseVideoUrl: "https://example.com/v",
            sets: 3,
            reps: 10,
            repsScheme: null,
            weightKg: 20,
            intensity: null,
            tempo: null,
            durationSecs: null,
            restSecs: 60,
            trainerNotes: null,
            isOverridden: false,
            groupLabel: null,
            groupRestSecs: null,
          },
        ],
      },
    ])
  })

  it("falls back gracefully when an exercise is missing from the map", () => {
    const result = mapTemplateToRoutineDays(makeTemplate(), new Map())
    expect(result[0].blocks[0].exerciseName).toBe("Ejercicio")
    expect(result[0].blocks[0].exerciseVideoUrl).toBeNull()
  })
})
