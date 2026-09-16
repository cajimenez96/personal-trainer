"use server"

import { redirect } from "next/navigation"
import { DniAlreadyExistsError, studentService } from "@/lib/services/student.service"
import { createStudentSchema, updateStudentSchema } from "@/lib/validators/student"

export type ExistingStudentConflict = {
  id: string
  name: string
  dni: string
  isActive: boolean
}

export type CreateStudentState = {
  errors?: Partial<Record<string, string>>
  values?: Record<string, string>
  existingStudent?: ExistingStudentConflict
}

export async function createStudentAction(
  _prevState: CreateStudentState,
  formData: FormData,
): Promise<CreateStudentState> {
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>
  const parsed = createStudentSchema.safeParse(raw)

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === "string" && !errors[key]) errors[key] = issue.message
    }
    return { errors, values: raw }
  }

  try {
    await studentService.create(parsed.data)
  } catch (err) {
    if (err instanceof DniAlreadyExistsError) {
      return {
        errors: { dni: err.message },
        values: raw,
        existingStudent: err.existingStudent
          ? {
              id: err.existingStudent.id,
              name: `${err.existingStudent.firstName} ${err.existingStudent.lastName}`.trim(),
              dni: err.dni,
              isActive: err.existingStudent.isActive,
            }
          : undefined,
      }
    }
    throw err
  }

  redirect("/alumnos?created=1")
}

export async function updateStudentAction(
  id: string,
  _prevState: CreateStudentState,
  formData: FormData,
): Promise<CreateStudentState> {
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>
  const parsed = updateStudentSchema.safeParse(raw)

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === "string" && !errors[key]) errors[key] = issue.message
    }
    return { errors, values: raw }
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    objetivoId,
    secondaryGoals,
    nivel,
    modalidadId,
    membershipStartsAt,
    paymentExpiresAt,
    accessOverride,
    healthNotes,
  } = parsed.data

  await studentService.update(id, {
    firstName,
    lastName,
    email: email ?? null,
    phone: phone ?? null,
    objetivoId: objetivoId ?? null,
    secondaryGoals: secondaryGoals ?? null,
    nivel: nivel ?? null,
    modalidadId: modalidadId ?? null,
    membershipStartsAt: membershipStartsAt ?? null,
    paymentExpiresAt: paymentExpiresAt ?? null,
    accessOverride: accessOverride ?? undefined,
    healthNotes: healthNotes ?? null,
  })

  redirect("/alumnos?updated=1")
}

export async function deactivateStudentAction(id: string) {
  await studentService.deactivate(id)
  redirect("/alumnos?deactivated=1")
}

export async function reactivateStudentAction(id: string) {
  await studentService.reactivate(id)
  redirect(`/alumnos/${id}?reactivated=1`)
}
