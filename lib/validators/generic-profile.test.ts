import { describe, expect, it } from "vitest"
import {
  GENERIC_LEVEL_LABEL,
  GENERIC_LEVEL_VALUES,
  assignGenericTemplateSchema,
  genericLevelSchema,
  genericPasswordSchema,
} from "./generic-profile"

describe("genericLevelSchema", () => {
  it("accepts the three known levels", () => {
    for (const level of GENERIC_LEVEL_VALUES) {
      expect(genericLevelSchema.safeParse(level).success).toBe(true)
    }
  })

  it("rejects anything else", () => {
    expect(genericLevelSchema.safeParse("olympia.basico").success).toBe(false)
    expect(genericLevelSchema.safeParse("").success).toBe(false)
    expect(genericLevelSchema.safeParse("BASICO").success).toBe(false)
  })
})

describe("GENERIC_LEVEL_LABEL", () => {
  it("has a label for every level", () => {
    expect(GENERIC_LEVEL_LABEL.basico).toBe("Básico")
    expect(GENERIC_LEVEL_LABEL.intermedio).toBe("Intermedio")
    expect(GENERIC_LEVEL_LABEL.avanzado).toBe("Avanzado")
  })
})

describe("genericPasswordSchema", () => {
  it("rejects passwords shorter than 8 characters", () => {
    const result = genericPasswordSchema.safeParse({ level: "basico", password: "short" })
    expect(result.success).toBe(false)
  })

  it("accepts a valid password", () => {
    const result = genericPasswordSchema.safeParse({ level: "basico", password: "olympia.basico" })
    expect(result.success).toBe(true)
  })
})

describe("assignGenericTemplateSchema", () => {
  it("requires a uuid templateId", () => {
    const result = assignGenericTemplateSchema.safeParse({ level: "basico", templateId: "not-a-uuid" })
    expect(result.success).toBe(false)
  })

  it("accepts a valid payload", () => {
    const result = assignGenericTemplateSchema.safeParse({
      level: "intermedio",
      templateId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    })
    expect(result.success).toBe(true)
  })
})
