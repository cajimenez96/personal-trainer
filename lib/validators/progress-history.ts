import { z } from "zod"

export const progressHistoryQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})

export type ProgressHistoryQuery = z.infer<typeof progressHistoryQuerySchema>
