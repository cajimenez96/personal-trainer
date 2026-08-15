import { z } from "zod"

export const exerciseBlockSchema = z.object({
  exerciseId: z.string().uuid("Seleccioná un ejercicio"),
  sets: z.coerce.number().int().positive("Series debe ser un número positivo"),
  reps: z.coerce.number().int().positive().optional().nullable(),
  durationSecs: z.coerce.number().int().positive().optional().nullable(),
  restSecs: z.coerce.number().int().nonnegative().optional().nullable(),
  trainerNotes: z.string().trim().optional().nullable(),
})

export const trainingDaySchema = z.object({
  label: z.string().trim().min(1, "La etiqueta del día es obligatoria"),
  blocks: z.array(exerciseBlockSchema),
})

export const createTemplateSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  description: z.string().trim().optional(),
  durationWeeks: z.coerce.number().int().min(2, "La vigencia mínima es de 2 semanas (RN-01)"),
  days: z.array(trainingDaySchema),
})

export type ExerciseBlockInput = z.infer<typeof exerciseBlockSchema>
export type TrainingDayInput = z.infer<typeof trainingDaySchema>
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>

// Raw shape sent from the client builder, before Zod's coerce.number() runs —
// number fields still arrive as strings straight out of <input> elements.
export type CreateTemplatePayload = {
  name: string
  description?: string
  durationWeeks: string
  days: {
    label: string
    blocks: {
      exerciseId: string
      sets: string
      reps?: string
      durationSecs?: string
      restSecs?: string
      trainerNotes?: string
    }[]
  }[]
}
