import { z } from "zod"

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v

export const createPlanSchema = z.object({
  name: z.string().trim().min(1, "El nombre del plan es obligatorio").max(60, "Máximo 60 caracteres"),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(200, "Máximo 200 caracteres").optional()),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  durationDays: z.coerce
    .number()
    .int("Debe ser un número entero de días")
    .positive("La duración debe ser mayor a 0 días")
    .default(30),
})

export type CreatePlanInput = z.infer<typeof createPlanSchema>

export const updatePlanSchema = createPlanSchema.extend({
  isActive: z.boolean().optional(),
})

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>
