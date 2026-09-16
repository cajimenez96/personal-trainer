import { z } from "zod"

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v

export const registerPaymentSchema = z.object({
  studentId: z.string().uuid("ID de alumno inválido"),
  subscriptionId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  amount: z.coerce.number().positive("El monto a pagar debe ser mayor a 0"),
  paidAt: z.coerce.date({ message: "Fecha de pago inválida" }),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(200, "Máximo 200 caracteres").optional()),
})

export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>
