"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { dniSchema } from "@/lib/validators/portal"
import { getTrainerBySlug } from "@/lib/tenant"
import { studentService } from "@/lib/services/student.service"
import { bodyWeightService } from "@/lib/services/body-weight.service"
import { evaluateStudentAccess } from "@/lib/utils/student-access"
import { todayUTC } from "@/lib/services/progress-log.service"

const updatePortalProfileSchema = z.object({
  coachSlug: z.string().min(1),
  dni: dniSchema,
  height: z.coerce.number().int().min(50).max(260).nullable().optional(),
  age: z.coerce.number().int().min(5).max(120).nullable().optional(),
  weightKg: z.coerce.number().positive().max(500).nullable().optional(),
  weightDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export type UpdatePortalProfileInput = z.infer<typeof updatePortalProfileSchema>
export type UpdatePortalProfileState = {
  ok: boolean
  error?: string
}

export async function updateStudentPortalProfileAction(
  input: UpdatePortalProfileInput,
): Promise<UpdatePortalProfileState> {
  const parsed = updatePortalProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos. Revisá los campos ingresados." }
  }

  const { coachSlug, dni, height, age, weightKg, weightDate } = parsed.data

  const coach = await getTrainerBySlug(coachSlug)
  if (!coach || !coach.isActive) {
    return { ok: false, error: "Entrenador no encontrado." }
  }

  const student = await studentService.getByDni(dni, coach.id)
  if (!student || !student.isActive) {
    return { ok: false, error: "Alumno no encontrado." }
  }

  const access = evaluateStudentAccess(student)
  if (!access.allowed) {
    return { ok: false, error: "El acceso se encuentra pausado o suspendido." }
  }

  // Actualizar altura y/o edad si se especificaron
  if (height !== undefined || age !== undefined) {
    await studentService.update(student.id, {
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      objetivoId: student.objetivoId,
      secondaryGoals: student.secondaryGoals,
      nivel: student.nivel,
      modalidadId: student.modalidadId,
      membershipStartsAt: student.membershipStartsAt,
      paymentExpiresAt: student.paymentExpiresAt,
      accessOverride: student.accessOverride,
      healthNotes: student.healthNotes,
      height: height !== undefined ? height : student.height,
      age: age !== undefined ? age : student.age,
    })
  }

  // Registrar nuevo peso corporal si fue provisto
  if (weightKg !== undefined && weightKg !== null && weightKg > 0) {
    const loggedDate = weightDate
      ? new Date(`${weightDate}T00:00:00.000Z`)
      : todayUTC()

    await bodyWeightService.log({
      studentId: student.id,
      loggedDate,
      weightKg,
    })
  }

  revalidatePath(`/${coachSlug}/rutina/${dni}`)
  return { ok: true }
}
