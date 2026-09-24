import { describe, expect, it } from "vitest"
import {
  GENERIC_LEVEL_LABEL,
  GENERIC_LEVEL_VALUES,
  assignGenericTemplateSchema,
  createGenericProfileSchema,
  deleteGenericProfileSchema,
  genericLevelSchema,
  genericPasswordSchema,
  updateGenericProfileSchema,
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
  it("rejects passwords shorter than 6 characters", () => {
    const result = genericPasswordSchema.safeParse({ level: "basico", password: "123" })
    expect(result.success).toBe(false)
  })

  it("accepts a valid password", () => {
    const result = genericPasswordSchema.safeParse({ level: "basico", password: "olympia.basico" })
    expect(result.success).toBe(true)
  })
})

describe("createGenericProfileSchema", () => {
  it("validates valid input", () => {
    const result = createGenericProfileSchema.safeParse({
      name: "Turno Mañana",
      password: "clave-secreta",
    })
    expect(result.success).toBe(true)
  })

  it("rejects short name or short password", () => {
    expect(
      createGenericProfileSchema.safeParse({
        name: "A",
        password: "clave-secreta",
      }).success,
    ).toBe(false)

    expect(
      createGenericProfileSchema.safeParse({
        name: "Turno Mañana",
        password: "123",
      }).success,
    ).toBe(false)
  })
})

describe("assignGenericTemplateSchema", () => {
  it("requires a uuid templateId and profileId", () => {
    const result = assignGenericTemplateSchema.safeParse({
      profileId: "profile-1",
      templateId: "not-a-uuid",
    })
    expect(result.success).toBe(false)
  })

  it("accepts a valid payload", () => {
    const result = assignGenericTemplateSchema.safeParse({
      profileId: "profile-1",
      templateId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    })
    expect(result.success).toBe(true)
  })
})

describe("updateGenericProfileSchema", () => {
  it("validates update input", () => {
    const result = updateGenericProfileSchema.safeParse({
      id: "profile-1",
      name: "Nuevo Nombre",
    })
    expect(result.success).toBe(true)
  })
})

describe("deleteGenericProfileSchema", () => {
  it("validates delete input", () => {
    const result = deleteGenericProfileSchema.safeParse({
      id: "profile-1",
    })
    expect(result.success).toBe(true)
  })
})
