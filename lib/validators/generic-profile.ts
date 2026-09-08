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
  level: genericLevelSchema,
  password: z.string().trim().min(8, "La clave debe tener al menos 8 caracteres"),
})
export type GenericPasswordInput = z.infer<typeof genericPasswordSchema>

export const assignGenericTemplateSchema = z.object({
  level: genericLevelSchema,
  templateId: z.string().uuid(),
})
export type AssignGenericTemplateInput = z.infer<typeof assignGenericTemplateSchema>
