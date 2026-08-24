"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ObjetivoInUseError, ObjetivoLabelTakenError, objetivoService } from "@/lib/services/objetivo.service"

export type LabelOptionActionState = { ok: boolean; error?: string }

const labelSchema = z.string().trim().min(1, "El nombre es obligatorio").max(50)

export async function createObjetivoAction(label: string): Promise<LabelOptionActionState> {
  const parsed = labelSchema.safeParse(label)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  try {
    await objetivoService.create(parsed.data)
  } catch (err) {
    if (err instanceof ObjetivoLabelTakenError) return { ok: false, error: err.message }
    throw err
  }

  revalidatePath("/dashboard")
  return { ok: true }
}

export async function renameObjetivoAction(
  id: string,
  label: string,
): Promise<LabelOptionActionState> {
  const parsed = labelSchema.safeParse(label)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  try {
    await objetivoService.rename(id, parsed.data)
  } catch (err) {
    if (err instanceof ObjetivoLabelTakenError) return { ok: false, error: err.message }
    throw err
  }

  revalidatePath("/dashboard")
  return { ok: true }
}

export async function deleteObjetivoAction(id: string): Promise<LabelOptionActionState> {
  try {
    await objetivoService.delete(id)
  } catch (err) {
    if (err instanceof ObjetivoInUseError) return { ok: false, error: err.message }
    throw err
  }

  revalidatePath("/dashboard")
  return { ok: true }
}
