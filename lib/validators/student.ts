import { z } from "zod"

export const NIVEL_VALUES = ["principiante", "intermedio", "avanzado"] as const

export const NIVEL_LABEL: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
}

export const ACCESS_OVERRIDE_VALUES = ["auto", "allowed", "blocked"] as const

export const ACCESS_OVERRIDE_LABEL: Record<string, string> = {
  auto: "Automático (según vencimiento)",
  allowed: "Permitir siempre (Excepción manual)",
  blocked: "Bloquear acceso (Suspendido)",
}

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v

export const studentListQuerySchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  objetivoId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  nivel: z.preprocess(emptyToUndefined, z.enum(NIVEL_VALUES).optional()),
  modalidadId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  planId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
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
  accessOverride: z.preprocess(emptyToUndefined, z.enum(ACCESS_OVERRIDE_VALUES).optional()),
  height: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(50, "Altura mínima 50 cm").max(260, "Altura máxima 260 cm").optional(),
  ),
  age: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(5, "Edad mínima 5 años").max(120, "Edad máxima 120 años").optional(),
  ),
  initialWeightKg: z.preprocess(
    emptyToUndefined,
    z.coerce.number().positive("El peso debe ser mayor a 0").max(500, "Peso máximo 500 kg").optional(),
  ),
  healthNotes: z.preprocess(emptyToUndefined, z.string().trim().optional()),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>

// DNI is the public unique identifier — never editable once the student exists.
export const updateStudentSchema = createStudentSchema.omit({ dni: true, initialWeightKg: true })

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
