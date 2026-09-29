import { describe, expect, it } from "vitest"
import {
  createTemplateSchema,
  exerciseBlockSchema,
} from "./routine-template"

describe("routine-template validator", () => {
  it("rejects reps <= 0 with Spanish error message", () => {
    const result = exerciseBlockSchema.safeParse({
      exerciseId: "35dc3803-6e07-43b9-8741-39a553199521",
      sets: 3,
      reps: 0,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Repeticiones debe ser un número positivo")
    }
  })

  it("allows empty or positive reps", () => {
    const validWithReps = exerciseBlockSchema.safeParse({
      exerciseId: "35dc3803-6e07-43b9-8741-39a553199521",
      sets: 3,
      reps: 15,
    })
    expect(validWithReps.success).toBe(true)

    const validWithoutReps = exerciseBlockSchema.safeParse({
      exerciseId: "35dc3803-6e07-43b9-8741-39a553199521",
      sets: 3,
    })
    expect(validWithoutReps.success).toBe(true)
  })

  it("allows weightKg to be 0 for bodyweight exercises", () => {
    const result = exerciseBlockSchema.safeParse({
      exerciseId: "35dc3803-6e07-43b9-8741-39a553199521",
      sets: 3,
      reps: 10,
      weightKg: 0,
    })
    expect(result.success).toBe(true)
  })

  it("rejects negative weightKg with Spanish message", () => {
    const result = exerciseBlockSchema.safeParse({
      exerciseId: "35dc3803-6e07-43b9-8741-39a553199521",
      sets: 3,
      reps: 10,
      weightKg: -5,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("El peso no puede ser negativo")
    }
  })

  it("validates template schema with nested days and blocks", () => {
    const result = createTemplateSchema.safeParse({
      name: "Rutina Hipertrofia",
      durationWeeks: 4,
      days: [
        {
          label: "Día 1",
          blocks: [
            {
              exerciseId: "35dc3803-6e07-43b9-8741-39a553199521",
              sets: 4,
              reps: 12,
              weightKg: 20,
            },
          ],
        },
      ],
    })
    expect(result.success).toBe(true)
  })
})
