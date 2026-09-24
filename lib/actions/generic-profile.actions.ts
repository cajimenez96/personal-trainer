"use server"

import { revalidatePath } from "next/cache"
import { requireCoachAuth } from "@/lib/auth"
import {
  genericProfileService,
  GenericProfileLimitReachedError,
} from "@/lib/services/generic-profile.service"
import {
  assignGenericTemplateSchema,
  createGenericProfileSchema,
  deleteGenericProfileSchema,
  genericPasswordSchema,
  updateGenericProfileSchema,
  type AssignGenericTemplateInput,
  type CreateGenericProfileInput,
  type DeleteGenericProfileInput,
  type GenericPasswordInput,
  type UpdateGenericProfileInput,
} from "@/lib/validators/generic-profile"

export type GenericActionState<T = unknown> = {
  ok: boolean
  error?: string
  data?: T
}

export async function createGenericProfileAction(
  input: CreateGenericProfileInput,
): Promise<GenericActionState<{ id: string }>> {
  try {
    const user = await requireCoachAuth()
    const parsed = createGenericProfileSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." }
    }

    const created = await genericProfileService.create(
      {
        name: parsed.data.name,
        password: parsed.data.password,
        templateId: parsed.data.templateId || null,
      },
      user.id,
    )

    revalidatePath("/alumnos-genericos")
    return { ok: true, data: { id: created.id } }
  } catch (err: unknown) {
    if (err instanceof GenericProfileLimitReachedError) {
      return { ok: false, error: err.message }
    }
    // Check for Prisma unique constraint error
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      return { ok: false, error: "Ya existe un alumno genérico con ese nombre." }
    }
    return { ok: false, error: "No se pudo crear el alumno genérico." }
  }
}

export async function updateGenericProfileAction(
  input: UpdateGenericProfileInput,
): Promise<GenericActionState> {
  try {
    const user = await requireCoachAuth()
    const parsed = updateGenericProfileSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." }
    }

    await genericProfileService.update(
      parsed.data.id,
      {
        name: parsed.data.name,
        templateId: parsed.data.templateId,
        password: parsed.data.password || undefined,
      },
      user.id,
    )

    revalidatePath("/alumnos-genericos")
    return { ok: true }
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      return { ok: false, error: "Ya existe un alumno genérico con ese nombre." }
    }
    return { ok: false, error: "No se pudo actualizar el alumno genérico." }
  }
}

export async function deleteGenericProfileAction(
  input: DeleteGenericProfileInput,
): Promise<GenericActionState> {
  try {
    const user = await requireCoachAuth()
    const parsed = deleteGenericProfileSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: "ID inválido." }
    }

    await genericProfileService.delete(parsed.data.id, user.id)
    revalidatePath("/alumnos-genericos")
    return { ok: true }
  } catch {
    return { ok: false, error: "No se pudo eliminar el alumno genérico." }
  }
}

export async function assignGenericTemplateAction(
  input: AssignGenericTemplateInput | { level: string; templateId: string },
): Promise<GenericActionState> {
  try {
    const user = await requireCoachAuth()
    let idOrLevel: string
    if ("profileId" in input) {
      const parsed = assignGenericTemplateSchema.safeParse(input)
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." }
      }
      idOrLevel = parsed.data.profileId
    } else {
      idOrLevel = input.level
    }

    if (!idOrLevel || !input.templateId) {
      return { ok: false, error: "Datos incompletos." }
    }

    await genericProfileService.assignTemplate(idOrLevel, input.templateId, user.id)
    revalidatePath("/alumnos-genericos")
    return { ok: true }
  } catch {
    return { ok: false, error: "No se pudo asignar la rutina." }
  }
}

export async function updateGenericPasswordAction(
  input: GenericPasswordInput,
): Promise<GenericActionState> {
  try {
    const user = await requireCoachAuth()
    const parsed = genericPasswordSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." }
    }

    await genericProfileService.updatePassword(parsed.data.level, parsed.data.password, user.id)
    revalidatePath("/alumnos-genericos")
    return { ok: true }
  } catch {
    return { ok: false, error: "No se pudo actualizar la clave." }
  }
}
