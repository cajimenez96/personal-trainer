"use server"

import { z } from "zod"
import { studentService } from "@/lib/services/student.service"
import { bodyWeightService } from "@/lib/services/body-weight.service"
import { todayUTC } from "@/lib/services/progress-log.service"
import { dniSchema } from "@/lib/validators/portal"

const logBodyWeightSchema = z.object({
  dni: dniSchema,
  weightKg: z.coerce.number().positive().max(500),
})

export async function logBodyWeightAction(
  input: z.infer<typeof logBodyWeightSchema>,
): Promise<{ error?: string }> {
  const parsed = logBodyWeightSchema.safeParse(input)
  if (!parsed.success) return { error: "Peso inválido" }

  // Ruta pública sin sesión — nunca confiar en un studentId del cliente,
  // se re-deriva todo desde el DNI (mismo criterio que progress.actions.ts).
  const student = await studentService.getByDni(parsed.data.dni)
  if (!student || !student.isActive) return { error: "Alumno no encontrado" }

  await bodyWeightService.log({
    studentId: student.id,
    loggedDate: todayUTC(),
    weightKg: parsed.data.weightKg,
  })

  return {}
}
