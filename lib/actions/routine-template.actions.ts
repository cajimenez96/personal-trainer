"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requireCoachAuth } from "@/lib/auth"
import {
  RoutineTemplateInUseError,
  routineTemplateService,
  TemplateBlockInUseError,
} from "@/lib/services/routine-template.service"
import {
  createTemplateSchema,
  type CreateTemplatePayload,
} from "@/lib/validators/routine-template"
import type { z } from "zod"

const FIELD_LABELS: Record<string, string> = {
  exerciseId: "Ejercicio",
  sets: "Series",
  reps: "Repeticiones",
  repsScheme: "Esquema de repeticiones",
  weightKg: "Peso",
  durationSecs: "Duración",
  restSecs: "Descanso",
  groupLabel: "Grupo",
  groupRestSecs: "Descanso de grupo",
  trainerNotes: "Notas del entrenador",
  name: "Nombre",
  durationWeeks: "Duración",
  label: "Etiqueta del día",
}

function formatTemplateZodErrors(issues: z.ZodIssue[]): Record<string, string> {
  const errors: Record<string, string> = {}
  const descriptiveMessages: string[] = []

  for (const issue of issues) {
    const fullKey = issue.path.join(".")
    if (fullKey && !errors[fullKey]) errors[fullKey] = issue.message

    const rootKey = issue.path[0]
    if (typeof rootKey === "string" && !errors[rootKey]) errors[rootKey] = issue.message

    if (issue.path[0] === "days" && typeof issue.path[1] === "number") {
      const dayNum = issue.path[1] + 1
      let context = `Día ${dayNum}`
      if (issue.path[2] === "blocks" && typeof issue.path[3] === "number") {
        const blockNum = issue.path[3] + 1
        const field = issue.path[4]
        const fieldName =
          typeof field === "string" ? FIELD_LABELS[field] || field : ""
        context += `, Ejercicio ${blockNum}${fieldName ? ` (${fieldName})` : ""}`
      } else if (issue.path[2] === "label") {
        context += ` (Nombre)`
      }
      descriptiveMessages.push(`${context}: ${issue.message}`)
    }
  }

  if (descriptiveMessages.length > 0) {
    errors.general = descriptiveMessages.join(". ")
  }

  return errors
}

export type CreateTemplateState = {
  ok: boolean
  errors?: Partial<Record<string, string>>
}

export async function createTemplateAction(
  input: CreateTemplatePayload,
): Promise<CreateTemplateState> {
  const user = await requireCoachAuth()
  const parsed = createTemplateSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, errors: formatTemplateZodErrors(parsed.error.issues) }
  }

  await routineTemplateService.create({ ...parsed.data, trainerId: user.id })

  redirect("/plantillas?created=1")
}

export async function updateTemplateAction(
  id: string,
  input: CreateTemplatePayload,
): Promise<CreateTemplateState> {
  await requireCoachAuth()
  const parsed = createTemplateSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, errors: formatTemplateZodErrors(parsed.error.issues) }
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
  const user = await requireCoachAuth()
  const copy = await routineTemplateService.duplicate(id)
  redirect(`/plantillas/${copy.id}?duplicated=1`)
}

export type DeleteTemplateState = { ok: boolean; error?: string }

export async function deleteTemplateAction(id: string): Promise<DeleteTemplateState> {
  await requireCoachAuth()
  try {
    await routineTemplateService.delete(id)
  } catch (err) {
    if (err instanceof RoutineTemplateInUseError) return { ok: false, error: err.message }
    throw err
  }

  revalidatePath("/plantillas")
  return { ok: true }
}

