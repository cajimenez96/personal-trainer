import { z } from "zod";

export const assignCoachPlanSchema = z.object({
  trainerId: z.string().min(1, "El ID del entrenador es requerido"),
  planId: z.string().min(1, "El ID del plan es requerido"),
  customPrice: z.coerce.number().min(0).optional(),
  startDate: z.string().optional(),
  extendMembership: z.boolean().default(true),
  notes: z.string().max(200).optional().or(z.literal("")),
});

export type AssignCoachPlanInput = z.infer<typeof assignCoachPlanSchema>;

export const recordCoachPaymentSchema = z.object({
  trainerId: z.string().min(1, "El ID del entrenador es requerido"),
  subscriptionId: z.string().optional().or(z.literal("")),
  amount: z.coerce.number().min(0, "El monto debe ser mayor o igual a 0"),
  paidAt: z.string().min(1, "La fecha de pago es requerida"),
  paymentMethod: z
    .string()
    .max(50, "El método de pago no puede exceder 50 caracteres")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(300, "Las notas no pueden exceder 300 caracteres")
    .optional()
    .or(z.literal("")),
  extendDays: z.coerce
    .number()
    .int("Debe ser un número entero de días")
    .min(0)
    .optional(),
});

export type RecordCoachPaymentInput = z.infer<typeof recordCoachPaymentSchema>;

export const updateCoachSubscriptionStatusSchema = z.object({
  subscriptionId: z.string().min(1, "El ID de la suscripción es requerido"),
  status: z.enum(["ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELED"]),
});

export type UpdateCoachSubscriptionStatusInput = z.infer<
  typeof updateCoachSubscriptionStatusSchema
>;
