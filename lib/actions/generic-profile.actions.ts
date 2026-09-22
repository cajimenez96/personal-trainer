"use server"

import { revalidatePath } from "next/cache"
import { requireCoachAuth } from "@/lib/auth"
import { genericProfileService } from "@/lib/services/generic-profile.service"
import {
  assignGenericTemplateSchema,
  genericPasswordSchema,
  type AssignGenericTemplateInput,
  type GenericPasswordInput,
} from "@/lib/validators/generic-profile"

export type GenericActionState = { ok: boolean; error?: string }

export async function assignGenericTemplateAction(
  input: AssignGenericTemplateInput,
): Promise<GenericActionState> {
  const user = await requireCoachAuth()
  const parsed = assignGenericTemplateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Datos inválidos." }

  await genericProfileService.assignTemplate(parsed.data.level, parsed.data.templateId, user.id)
  revalidatePath("/alumnos-genericos")
  return { ok: true }
}

export async function updateGenericPasswordAction(
  input: GenericPasswordInput,
): Promise<GenericActionState> {
  const user = await requireCoachAuth()
  const parsed = genericPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." }
  }

  await genericProfileService.updatePassword(parsed.data.level, parsed.data.password, user.id)
  revalidatePath("/alumnos-genericos")
  return { ok: true }
}
