"use server"

import { revalidatePath } from "next/cache"
import { paymentService } from "@/lib/services/payment.service"
import { registerPaymentSchema, type RegisterPaymentInput } from "@/lib/validators/payment"

export type PaymentActionResult = {
  ok: boolean
  error?: string
}

export async function registerPaymentAction(
  input: RegisterPaymentInput,
): Promise<PaymentActionResult> {
  const parsed = registerPaymentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  try {
    await paymentService.registerPayment({
      studentId: parsed.data.studentId,
      amount: parsed.data.amount,
      paidAt: parsed.data.paidAt,
      notes: parsed.data.notes,
      subscriptionId: parsed.data.subscriptionId,
    })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al registrar el pago." }
  }

  revalidatePath(`/alumnos/${parsed.data.studentId}`)
  return { ok: true }
}

export async function deletePaymentAction(
  id: string,
  studentId: string,
): Promise<PaymentActionResult> {
  try {
    await paymentService.deletePayment(id)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al eliminar el pago." }
  }

  revalidatePath(`/alumnos/${studentId}`)
  return { ok: true }
}
