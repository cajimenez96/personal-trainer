import { z } from "zod"

export const assignPlanSchema = z.object({
  studentId: z.string().uuid("ID de alumno inválido"),
  planId: z.string().uuid("ID de plan inválido"),
  startDate: z.coerce.date({ message: "Fecha de inicio inválida" }),
})

export type AssignPlanInput = z.infer<typeof assignPlanSchema>
