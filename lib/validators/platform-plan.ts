import { z } from "zod";

export const createPlatformPlanSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z
    .string()
    .trim()
    .max(300, "La descripción no puede exceder 300 caracteres")
    .optional()
    .or(z.literal("")),
  price: z.coerce
    .number()
    .min(0, "El precio debe ser igual o mayor a 0"),
  durationDays: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(1, "La vigencia mínima es de 1 día")
    .default(30),
  trialDays: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(0, "Los días de prueba no pueden ser negativos")
    .max(365, "Los días de prueba no pueden exceder 365 días")
    .default(0),
  maxStudents: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(1, "Debe permitir al menos 1 alumno")
    .default(10),
  maxPlans: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(1, "Debe permitir al menos 1 plan de entrenamiento")
    .default(1),
  maxGenericProfiles: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(0, "No puede ser negativo")
    .default(3),
  isActive: z.boolean().default(true),
});

export type CreatePlatformPlanInput = z.input<typeof createPlatformPlanSchema>;

export const updatePlatformPlanSchema = createPlatformPlanSchema.extend({
  id: z.string().min(1, "El ID del plan es requerido"),
});

export type UpdatePlatformPlanInput = z.input<typeof updatePlatformPlanSchema>;

export const togglePlatformPlanSchema = z.object({
  id: z.string().min(1, "El ID del plan es requerido"),
  isActive: z.boolean(),
});

export type TogglePlatformPlanInput = z.infer<typeof togglePlatformPlanSchema>;

export const setGlobalTrialDaysSchema = z.object({
  trialDays: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(0, "Los días de prueba no pueden ser negativos")
    .max(365, "Los días de prueba no pueden exceder 365 días"),
});

export type SetGlobalTrialDaysInput = z.infer<typeof setGlobalTrialDaysSchema>;
