"use server"

import { z } from "zod"
import { assignedRoutineService } from "@/lib/services/assigned-routine.service"

const chunkSchema = z.object({
  templateId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).min(1).max(50),
})

export type BulkAssignChunkResult = {
  succeeded: string[]
  failed: { studentId: string; error: string }[]
}

export async function assignRoutineChunkAction(
  input: z.infer<typeof chunkSchema>,
): Promise<BulkAssignChunkResult> {
  const { templateId, studentIds } = chunkSchema.parse(input)

  const succeeded: string[] = []
  const failed: { studentId: string; error: string }[] = []

  for (const studentId of studentIds) {
    try {
      await assignedRoutineService.assign({ studentId, templateId, overrides: [] })
      succeeded.push(studentId)
    } catch (err) {
      failed.push({
        studentId,
        error: err instanceof Error ? err.message : "Error desconocido",
      })
    }
  }

  return { succeeded, failed }
}
