import { z } from "zod"

export const GENERIC_LEVEL_VALUES = ["basico", "intermedio", "avanzado"] as const

export type GenericLevelValue = (typeof GENERIC_LEVEL_VALUES)[number]

export const GENERIC_LEVEL_LABEL: Record<GenericLevelValue, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
}

export const genericLevelSchema = z.enum(GENERIC_LEVEL_VALUES)

export const genericPasswordSchema = z.object({
  level: z.string().min(1),
  password: z.string().trim().min(6, "La clave debe tener al menos 6 caracteres"),
})
export type GenericPasswordInput = z.infer<typeof genericPasswordSchema>

export const createGenericProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  password: z
    .string()
    .trim()
    .min(6, "La clave debe tener al menos 6 caracteres"),
  templateId: z
    .string()
    .uuid("ID de plantilla inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
})
export type CreateGenericProfileInput = z.infer<typeof createGenericProfileSchema>

export const updateGenericProfileSchema = z.object({
  id: z.string().min(1, "El ID es requerido"),
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .optional(),
  password: z
    .string()
    .trim()
    .min(6, "La clave debe tener al menos 6 caracteres")
    .optional()
    .or(z.literal("")),
  templateId: z
    .string()
    .uuid("ID de plantilla inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
})
export type UpdateGenericProfileInput = z.infer<typeof updateGenericProfileSchema>

export const deleteGenericProfileSchema = z.object({
  id: z.string().min(1, "El ID es requerido"),
})
export type DeleteGenericProfileInput = z.infer<typeof deleteGenericProfileSchema>

export const assignGenericTemplateSchema = z.object({
  profileId: z.string().min(1, "El ID del perfil es requerido"),
  templateId: z.string().uuid("ID de plantilla inválido"),
})
export type AssignGenericTemplateInput = z.infer<typeof assignGenericTemplateSchema>
