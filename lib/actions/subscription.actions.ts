"use server"

import { revalidatePath } from "next/cache"
import { requireCoachAuth } from "@/lib/auth"
import { subscriptionService } from "@/lib/services/subscription.service"
import { assignPlanSchema, type AssignPlanInput } from "@/lib/validators/subscription"

export type SubscriptionActionResult = {
  ok: boolean
  error?: string
}

export async function assignPlanAction(input: AssignPlanInput): Promise<SubscriptionActionResult> {
  await requireCoachAuth()
  const parsed = assignPlanSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  try {
    await subscriptionService.assignPlan({
      studentId: parsed.data.studentId,
      planId: parsed.data.planId,
      startDate: parsed.data.startDate,
    })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al asignar plan." }
  }

  revalidatePath("/alumnos")
  revalidatePath(`/alumnos/${parsed.data.studentId}`)
  return { ok: true }
}

