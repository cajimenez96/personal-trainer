import { z } from "zod"
import { slugSchema } from "./slug"

export const createCoachSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  email: z.string().email("Ingresá un correo electrónico válido"),
  password: z
    .string()
    .min(8, "La contraseña temporal debe tener al menos 8 caracteres")
    .max(100, "La contraseña no puede exceder 100 caracteres"),
  slug: slugSchema,
  businessName: z
    .string()
    .max(100, "El nombre comercial no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),
  whatsappNumber: z
    .string()
    .max(30, "El número de WhatsApp no puede exceder 30 caracteres")
    .optional()
    .or(z.literal("")),
  maxPlans: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(1, "Debe permitir al menos 1 plan")
    .default(1),
  maxStudents: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(1, "Debe permitir al menos 1 alumno")
    .default(10),
  maxGenericProfiles: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(0, "Debe ser al menos 0")
    .default(3),
  membershipExpiresAt: z
    .string()
    .optional()
    .nullable()
    .or(z.literal("")),
})

export type CreateCoachInput = z.infer<typeof createCoachSchema>

export const updateCoachBySuperAdminSchema = z.object({
  trainerId: z.string().min(1, "El ID del entrenador es requerido"),
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  email: z.string().email("Ingresá un correo electrónico válido"),
  slug: slugSchema,
  businessName: z
    .string()
    .max(100, "El nombre comercial no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),
  headline: z
    .string()
    .max(150, "El titular no puede exceder 150 caracteres")
    .optional()
    .or(z.literal("")),
  tagline: z
    .string()
    .max(300, "La bajada o descripción no puede exceder 300 caracteres")
    .optional()
    .or(z.literal("")),
  logoUrl: z
    .string()
    .max(500, "La URL del logo no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  heroImageUrl: z
    .string()
    .max(500, "La URL de portada no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  whatsappNumber: z
    .string()
    .max(30, "El número de WhatsApp no puede exceder 30 caracteres")
    .optional()
    .or(z.literal("")),
  instagramUrl: z
    .string()
    .max(100, "El usuario o URL de Instagram no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),
  maxPlans: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(1, "Debe permitir al menos 1 plan")
    .default(1),
  maxStudents: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(1, "Debe permitir al menos 1 alumno")
    .default(10),
  maxGenericProfiles: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(0, "Debe ser al menos 0")
    .default(3),
  membershipExpiresAt: z
    .string()
    .optional()
    .nullable()
    .or(z.literal("")),
})

export type UpdateCoachBySuperAdminInput = z.infer<
  typeof updateCoachBySuperAdminSchema
>

export const toggleCoachStatusSchema = z.object({
  trainerId: z.string().min(1, "El ID del entrenador es requerido"),
  isActive: z.boolean(),
})

export type ToggleCoachStatusInput = z.infer<typeof toggleCoachStatusSchema>

export const resetCoachPasswordSchema = z.object({
  trainerId: z.string().min(1, "El ID del entrenador es requerido"),
  newPassword: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña no puede exceder 100 caracteres"),
})

export type ResetCoachPasswordInput = z.infer<typeof resetCoachPasswordSchema>
