import { z } from "zod"

export const exerciseBlockSchema = z.object({
  id: z.string().uuid().optional(),
  exerciseId: z.string().uuid("Seleccioná un ejercicio"),
  sets: z.coerce.number().int().positive("Series debe ser un número positivo"),
  reps: z.coerce.number().int().positive().optional().nullable(),
  // Texto libre para esquemas variables (ej. "1x6 2x5 1x4") — se muestra en vez
  // de `reps` cuando está presente, no reemplaza el campo numérico simple.
  repsScheme: z.string().trim().max(100).optional().nullable(),
  weightKg: z.coerce.number().positive().optional().nullable(),
  // Texto libre tipo "@7" (notación RPE) — deliberadamente no una escala estricta.
  intensity: z.string().trim().max(20).optional().nullable(),
  // Texto libre tipo "3-1-1-0" o "controlado" — no obligatorio, no una métrica central.
  tempo: z.string().trim().max(20).optional().nullable(),
  durationSecs: z.coerce.number().int().positive().optional().nullable(),
  restSecs: z.coerce.number().int().nonnegative().optional().nullable(),
  trainerNotes: z.string().trim().optional().nullable(),
  // HU-33: etiqueta corta de agrupación (ej. "A") para formar superseries —
  // el agrupamiento es por etiqueta + orden consecutivo dentro del día.
  groupLabel: z.string().trim().max(10).optional().nullable(),
  groupRestSecs: z.coerce.number().int().nonnegative().optional().nullable(),
})

export const trainingDaySchema = z.object({
  id: z.string().uuid().optional(),
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
    id?: string
    label: string
    blocks: {
      id?: string
      exerciseId: string
      sets: string
      reps?: string
      repsScheme?: string
      weightKg?: string
      intensity?: string
      tempo?: string
      durationSecs?: string
      restSecs?: string
      trainerNotes?: string
      groupLabel?: string
      groupRestSecs?: string
    }[]
  }[]
}
