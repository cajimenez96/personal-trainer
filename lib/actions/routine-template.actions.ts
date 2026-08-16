"use server"

import { redirect } from "next/navigation"
import { routineTemplateService, TemplateBlockInUseError } from "@/lib/services/routine-template.service"
import {
  createTemplateSchema,
  type CreateTemplatePayload,
} from "@/lib/validators/routine-template"

export type CreateTemplateState = {
  ok: boolean
  errors?: Partial<Record<string, string>>
}

export async function createTemplateAction(
  input: CreateTemplatePayload,
): Promise<CreateTemplateState> {
  const parsed = createTemplateSchema.safeParse(input)

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === "string" && !errors[key]) errors[key] = issue.message
    }
    return { ok: false, errors }
  }

  await routineTemplateService.create(parsed.data)

  redirect("/plantillas?created=1")
}

export async function updateTemplateAction(
  id: string,
  input: CreateTemplatePayload,
): Promise<CreateTemplateState> {
  const parsed = createTemplateSchema.safeParse(input)

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === "string" && !errors[key]) errors[key] = issue.message
    }
    return { ok: false, errors }
  }

  try {
    await routineTemplateService.update(id, parsed.data)
  } catch (err) {
    if (err instanceof TemplateBlockInUseError) {
      return { ok: false, errors: { general: err.message } }
    }
    throw err
  }

  redirect("/plantillas?updated=1")
}

export async function duplicateTemplateAction(id: string) {
  const copy = await routineTemplateService.duplicate(id)
  redirect(`/plantillas/${copy.id}?duplicated=1`)
}
