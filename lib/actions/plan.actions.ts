"use server"

import { revalidatePath } from "next/cache"
import { requireCoachAuth } from "@/lib/auth"
import {
  PlanInUseError,
  PlanLimitReachedError,
  PlanNameAlreadyExistsError,
  planService,
} from "@/lib/services/plan.service"
import {
  createPlanSchema,
  updatePlanSchema,
  type CreatePlanInput,
  type UpdatePlanInput,
} from "@/lib/validators/plan"

export type PlanActionResult = {
  ok: boolean
  error?: string
}

export async function createPlanAction(input: CreatePlanInput): Promise<PlanActionResult> {
  const user = await requireCoachAuth()
  const parsed = createPlanSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  try {
    await planService.create({ ...parsed.data, trainerId: user.id })
  } catch (err) {
    if (err instanceof PlanLimitReachedError || err instanceof PlanNameAlreadyExistsError) {
      return { ok: false, error: err.message }
    }
    return { ok: false, error: "Ocurrió un error inesperado al crear el plan." }
  }

  revalidatePath("/planes")
  revalidatePath("/alumnos")
  return { ok: true }
}

export async function updatePlanAction(
  id: string,
  input: UpdatePlanInput,
): Promise<PlanActionResult> {
  await requireCoachAuth()
  const parsed = updatePlanSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  try {
    await planService.update(id, parsed.data)
  } catch (err) {
    if (err instanceof PlanLimitReachedError || err instanceof PlanNameAlreadyExistsError) {
      return { ok: false, error: err.message }
    }
    return { ok: false, error: err instanceof Error ? err.message : "Error al actualizar el plan." }
  }

  revalidatePath("/planes")
  revalidatePath("/alumnos")
  return { ok: true }
}

export async function deletePlanAction(id: string): Promise<PlanActionResult> {
  await requireCoachAuth()
  try {
    await planService.delete(id)
  } catch (err) {
    if (err instanceof PlanInUseError) {
      return { ok: false, error: err.message }
    }
    return { ok: false, error: "Error al eliminar el plan." }
  }

  revalidatePath("/planes")
  return { ok: true }
}

