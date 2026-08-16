import { z } from "zod"
import { NOTE_TYPE_VALUES } from "@/lib/validators/progress-note"

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v

export const progressHistoryQuerySchema = z.object({
  from: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  to: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  noteType: z.preprocess(emptyToUndefined, z.enum(NOTE_TYPE_VALUES).optional()),
})

export type ProgressHistoryQuery = z.infer<typeof progressHistoryQuerySchema>
