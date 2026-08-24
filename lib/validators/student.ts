import { z } from "zod"

export const NIVEL_VALUES = ["principiante", "intermedio", "avanzado"] as const

export const NIVEL_LABEL: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
}

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v

export const studentListQuerySchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  objetivoId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  nivel: z.preprocess(emptyToUndefined, z.enum(NIVEL_VALUES).optional()),
  modalidadId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? true : v === "true")),
  cursor: z.string().uuid().optional(),
})

export type StudentListQuery = z.infer<typeof studentListQuerySchema>

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
  objetivoId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  secondaryGoals: z.preprocess(emptyToUndefined, z.string().trim().max(300).optional()),
  nivel: z.preprocess(emptyToUndefined, z.enum(NIVEL_VALUES).optional()),
  modalidadId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
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
