"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ModalidadInUseError, ModalidadLabelTakenError, modalidadService } from "@/lib/services/modalidad.service"

export type LabelOptionActionState = { ok: boolean; error?: string }

const labelSchema = z.string().trim().min(1, "El nombre es obligatorio").max(50)

export async function createModalidadAction(label: string): Promise<LabelOptionActionState> {
  const parsed = labelSchema.safeParse(label)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  try {
    await modalidadService.create(parsed.data)
  } catch (err) {
    if (err instanceof ModalidadLabelTakenError) return { ok: false, error: err.message }
    throw err
  }

  revalidatePath("/dashboard")
  return { ok: true }
}

export async function renameModalidadAction(
  id: string,
  label: string,
): Promise<LabelOptionActionState> {
  const parsed = labelSchema.safeParse(label)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  try {
    await modalidadService.rename(id, parsed.data)
  } catch (err) {
    if (err instanceof ModalidadLabelTakenError) return { ok: false, error: err.message }
    throw err
  }

  revalidatePath("/dashboard")
  return { ok: true }
}

export async function deleteModalidadAction(id: string): Promise<LabelOptionActionState> {
  try {
    await modalidadService.delete(id)
  } catch (err) {
    if (err instanceof ModalidadInUseError) return { ok: false, error: err.message }
    throw err
  }

  revalidatePath("/dashboard")
  return { ok: true }
}
