import { z } from "zod"

export const updateCoachProfileSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
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
    .max(500, "La URL de la imagen de portada no puede exceder 500 caracteres")
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
})

export type UpdateCoachProfileInput = z.infer<typeof updateCoachProfileSchema>
