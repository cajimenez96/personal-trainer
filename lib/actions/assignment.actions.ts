"use server"

import { redirect } from "next/navigation"
import { assignedRoutineService } from "@/lib/services/assigned-routine.service"
import { assignRoutineSchema, type AssignRoutinePayload } from "@/lib/validators/assignment"

export type AssignRoutineState = {
  ok: boolean
  error?: string
}

export async function assignRoutineAction(
  input: AssignRoutinePayload,
): Promise<AssignRoutineState> {
  const parsed = assignRoutineSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos. Revisá el formulario." }
  }

  await assignedRoutineService.assign(parsed.data)

  redirect(`/alumnos/${parsed.data.studentId}?assigned=1`)
}
