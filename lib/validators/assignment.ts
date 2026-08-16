import { z } from "zod"

export const overrideSchema = z.object({
  exerciseBlockId: z.string().uuid(),
  sets: z.number().int().positive().optional().nullable(),
  reps: z.number().int().positive().optional().nullable(),
  repsScheme: z.string().trim().max(100).optional().nullable(),
  weightKg: z.number().positive().optional().nullable(),
  intensity: z.string().trim().max(20).optional().nullable(),
  tempo: z.string().trim().max(20).optional().nullable(),
  durationSecs: z.number().int().positive().optional().nullable(),
  restSecs: z.number().int().nonnegative().optional().nullable(),
  trainerNotes: z.string().trim().optional().nullable(),
})

export const assignRoutineSchema = z.object({
  studentId: z.string().uuid(),
  templateId: z.string().uuid(),
  overrides: z.array(overrideSchema),
})

export type AssignRoutinePayload = z.infer<typeof assignRoutineSchema>
