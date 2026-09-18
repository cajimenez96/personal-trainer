import { describe, it, expect } from "vitest"
import {
  createCoachSchema,
  toggleCoachStatusSchema,
  resetCoachPasswordSchema,
} from "./superadmin"

describe("SuperAdmin Validators", () => {
  describe("createCoachSchema", () => {
    it("validates a valid coach creation payload", () => {
      const result = createCoachSchema.safeParse({
        name: "Valeria Gómez",
        email: "valeria@fitclub.com",
        password: "password123",
        slug: "valeria-gomez",
        businessName: "VG Training",
        whatsappNumber: "+5491112345678",
      })

      expect(result.success).toBe(true)
    })

    it("rejects reserved slugs", () => {
      const result = createCoachSchema.safeParse({
        name: "Admin User",
        email: "admin@fitclub.com",
        password: "password123",
        slug: "superadmin",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("reservado")
      }
    })

    it("rejects short passwords and invalid emails", () => {
      const result = createCoachSchema.safeParse({
        name: "A",
        email: "not-an-email",
        password: "short",
        slug: "valid-slug",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.name).toBeDefined()
        expect(result.error.flatten().fieldErrors.email).toBeDefined()
        expect(result.error.flatten().fieldErrors.password).toBeDefined()
      }
    })
  })

  describe("toggleCoachStatusSchema", () => {
    it("validates status toggle payload", () => {
      const result = toggleCoachStatusSchema.safeParse({
        trainerId: "trainer_123",
        isActive: false,
      })

      expect(result.success).toBe(true)
    })
  })

  describe("resetCoachPasswordSchema", () => {
    it("validates password reset with min 8 chars", () => {
      const valid = resetCoachPasswordSchema.safeParse({
        trainerId: "trainer_123",
        newPassword: "newpassword123",
      })
      expect(valid.success).toBe(true)

      const invalid = resetCoachPasswordSchema.safeParse({
        trainerId: "trainer_123",
        newPassword: "short",
      })
      expect(invalid.success).toBe(false)
    })
  })
})
