import type { AccessOverride } from "@/app/generated/prisma/client"

export type StudentAccessReason =
  | "active"
  | "manual_allowed"
  | "inactive"
  | "expired"
  | "manual_blocked"

export type StudentAccessResult = {
  allowed: boolean
  reason: StudentAccessReason
  expiresAt: Date | null
}

export function evaluateStudentAccess(
  student: {
    isActive: boolean
    accessOverride?: AccessOverride | null
    paymentExpiresAt?: Date | string | null
  },
  referenceDate: Date = new Date()
): StudentAccessResult {
  if (!student.isActive) {
    return {
      allowed: false,
      reason: "inactive",
      expiresAt: student.paymentExpiresAt ? new Date(student.paymentExpiresAt) : null,
    }
  }

  const override = student.accessOverride ?? "auto"

  if (override === "blocked") {
    return {
      allowed: false,
      reason: "manual_blocked",
      expiresAt: student.paymentExpiresAt ? new Date(student.paymentExpiresAt) : null,
    }
  }

  if (override === "allowed") {
    return {
      allowed: true,
      reason: "manual_allowed",
      expiresAt: student.paymentExpiresAt ? new Date(student.paymentExpiresAt) : null,
    }
  }

  // Automatic evaluation based on expiration date
  if (student.paymentExpiresAt) {
    const expiresDate = new Date(student.paymentExpiresAt)
    // Compare dates at midnight to give the student the entire expiration day
    const refYear = referenceDate.getFullYear()
    const refMonth = referenceDate.getMonth()
    const refDay = referenceDate.getDate()

    const todayMidnight = new Date(refYear, refMonth, refDay, 0, 0, 0, 0)
    const expiresMidnight = new Date(
      expiresDate.getUTCFullYear(),
      expiresDate.getUTCMonth(),
      expiresDate.getUTCDate(),
      0,
      0,
      0,
      0
    )

    if (expiresMidnight < todayMidnight) {
      return {
        allowed: false,
        reason: "expired",
        expiresAt: expiresDate,
      }
    }

    return {
      allowed: true,
      reason: "active",
      expiresAt: expiresDate,
    }
  }

  return {
    allowed: true,
    reason: "active",
    expiresAt: null,
  }
}
