import { z } from "zod"

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v

export const exerciseListQuerySchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  muscleGroup: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
})

export type ExerciseListQuery = z.infer<typeof exerciseListQuerySchema>

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  primaryMuscle: z.string().trim().min(1, "El músculo principal es obligatorio"),
  secondaryMuscle: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  videoUrl: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(
        /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i,
        "Debe ser un link válido de YouTube o Vimeo",
      )
      .optional(),
  ),
})

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>
