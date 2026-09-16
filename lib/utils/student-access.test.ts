import { describe, expect, it } from "vitest"
import { evaluateStudentAccess } from "./student-access"

describe("evaluateStudentAccess", () => {
  const referenceDate = new Date("2026-09-15T14:00:00.000Z")

  it("returns inactive if student is not active", () => {
    const result = evaluateStudentAccess(
      {
        isActive: false,
        accessOverride: "auto",
        paymentExpiresAt: new Date("2026-09-20"),
      },
      referenceDate
    )
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe("inactive")
  })

  it("returns manual_blocked when accessOverride is blocked even if payment is not expired", () => {
    const result = evaluateStudentAccess(
      {
        isActive: true,
        accessOverride: "blocked",
        paymentExpiresAt: new Date("2026-09-20"),
      },
      referenceDate
    )
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe("manual_blocked")
  })

  it("returns manual_allowed when accessOverride is allowed even if payment is expired", () => {
    const result = evaluateStudentAccess(
      {
        isActive: true,
        accessOverride: "allowed",
        paymentExpiresAt: new Date("2026-09-10"),
      },
      referenceDate
    )
    expect(result.allowed).toBe(true)
    expect(result.reason).toBe("manual_allowed")
  })

  it("returns expired in auto mode if paymentExpiresAt is before reference date", () => {
    const result = evaluateStudentAccess(
      {
        isActive: true,
        accessOverride: "auto",
        paymentExpiresAt: new Date("2026-09-11"),
      },
      referenceDate
    )
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe("expired")
  })

  it("returns active in auto mode if paymentExpiresAt is today or in the future", () => {
    const resultToday = evaluateStudentAccess(
      {
        isActive: true,
        accessOverride: "auto",
        paymentExpiresAt: new Date("2026-09-15"),
      },
      referenceDate
    )
    expect(resultToday.allowed).toBe(true)
    expect(resultToday.reason).toBe("active")

    const resultFuture = evaluateStudentAccess(
      {
        isActive: true,
        accessOverride: "auto",
        paymentExpiresAt: new Date("2026-09-25"),
      },
      referenceDate
    )
    expect(resultFuture.allowed).toBe(true)
    expect(resultFuture.reason).toBe("active")
  })

  it("returns active in auto mode if paymentExpiresAt is null (no expiration set)", () => {
    const result = evaluateStudentAccess(
      {
        isActive: true,
        accessOverride: "auto",
        paymentExpiresAt: null,
      },
      referenceDate
    )
    expect(result.allowed).toBe(true)
    expect(result.reason).toBe("active")
  })
})
