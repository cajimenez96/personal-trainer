import { z } from "zod"

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v

export const routineImportRowSchema = z.object({
  templateName: z.string().trim().min(1, "El nombre de la plantilla es obligatorio"),
  templateDescription: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  durationWeeks: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(2, "La vigencia mínima es de 2 semanas (RN-01)").optional(),
  ),
  dayLabel: z.string().trim().min(1, "La etiqueta del día es obligatoria"),
  dayOrder: z.coerce.number().int(),
  exerciseName: z.string().trim().min(1, "El nombre del ejercicio es obligatorio"),
  primaryMuscle: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  secondaryMuscle: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  videoUrl: z.preprocess(emptyToUndefined, z.string().trim().url("URL de video inválida").optional()),
  sets: z.coerce.number().int().positive("Series debe ser un número positivo"),
  reps: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  durationSecs: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  restSecs: z.preprocess(emptyToUndefined, z.coerce.number().int().nonnegative().optional()),
  trainerNotes: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  blockOrder: z.coerce.number().int(),
  studentDni: z.preprocess(
    emptyToUndefined,
    z.string().trim().regex(/^\d{7,9}$/, "DNI inválido").optional(),
  ),
})

export type RoutineImportRow = z.infer<typeof routineImportRowSchema>
