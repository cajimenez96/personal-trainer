import { describe, it, expect } from "vitest"
import { updateCoachProfileSchema } from "./coach-profile"

describe("Coach Profile Validators", () => {
  it("validates full coach branding and profile payload", () => {
    const result = updateCoachProfileSchema.safeParse({
      name: "Santiago Ramón",
      businessName: "SR Training Club",
      headline: "Entrenamiento Personalizado de Alto Rendimiento",
      tagline: "Consultá tu rutina ingresando tu DNI.",
      logoUrl: "https://example.com/logo.png",
      heroImageUrl: "https://example.com/hero.jpg",
      whatsappNumber: "+5491112345678",
      instagramUrl: "santiago.ramon",
    })

    expect(result.success).toBe(true)
  })

  it("allows empty optional fields", () => {
    const result = updateCoachProfileSchema.safeParse({
      name: "Santiago Ramón",
      businessName: "",
      headline: "",
      tagline: "",
      logoUrl: "",
      heroImageUrl: "",
      whatsappNumber: "",
      instagramUrl: "",
    })

    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = updateCoachProfileSchema.safeParse({
      name: "",
    })

    expect(result.success).toBe(false)
  })
})
