import { z } from "zod"

export const OBJETIVO_VALUES = ["hipertrofia", "fuerza", "descenso"] as const
export const NIVEL_VALUES = ["principiante", "intermedio", "avanzado"] as const
export const MODALIDAD_VALUES = ["gimnasio", "casa"] as const

export const OBJETIVO_LABEL: Record<string, string> = {
  hipertrofia: "Hipertrofia",
  fuerza: "Fuerza",
  descenso: "Descenso",
}

export const NIVEL_LABEL: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
}

export const MODALIDAD_LABEL: Record<string, string> = {
  gimnasio: "Gimnasio",
  casa: "Casa",
}

export const studentListQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  objetivo: z.enum(OBJETIVO_VALUES).optional(),
  nivel: z.enum(NIVEL_VALUES).optional(),
  modalidad: z.enum(MODALIDAD_VALUES).optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? true : v === "true")),
  cursor: z.string().uuid().optional(),
})

export type StudentListQuery = z.infer<typeof studentListQuerySchema>

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v

export const createStudentSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio"),
  lastName: z.string().trim().min(1, "El apellido es obligatorio"),
  dni: z
    .string()
    .trim()
    .regex(/^\d{7,9}$/, "DNI inválido (7 a 9 dígitos, sin puntos)"),
  email: z.preprocess(
    emptyToUndefined,
    z.string().trim().email("Email inválido").optional(),
  ),
  phone: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  objetivo: z.preprocess(emptyToUndefined, z.enum(OBJETIVO_VALUES).optional()),
  nivel: z.preprocess(emptyToUndefined, z.enum(NIVEL_VALUES).optional()),
  modalidad: z.preprocess(emptyToUndefined, z.enum(MODALIDAD_VALUES).optional()),
  membershipStartsAt: z.preprocess(
    emptyToUndefined,
    z.coerce.date({ error: "La fecha de inicio de membresía es obligatoria" }),
  ),
  paymentExpiresAt: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  healthNotes: z.preprocess(emptyToUndefined, z.string().trim().optional()),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>

// DNI is the public unique identifier — never editable once the student exists.
export const updateStudentSchema = createStudentSchema.omit({ dni: true })

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
