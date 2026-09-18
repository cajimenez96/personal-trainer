"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requireCoachAuth, requireSuperAdminAuth } from "@/lib/auth"
import {
  ExerciseInUseError,
  ExerciseNameTakenError,
  exerciseService,
} from "@/lib/services/exercise.service"
import { createExerciseSchema } from "@/lib/validators/exercise"

export type ExerciseFormState = {
  errors?: Partial<Record<string, string>>
  values?: Record<string, string>
}

// ─────────────────────────────────────────────
// COACH EXERCISE ACTIONS
// ─────────────────────────────────────────────

export async function createExerciseAction(
  _prevState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  const user = await requireCoachAuth()
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>
  const parsed = createExerciseSchema.safeParse(raw)

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === "string" && !errors[key]) errors[key] = issue.message
    }
    return { errors, values: raw }
  }

  try {
    await exerciseService.create({
      ...parsed.data,
      trainerId: user.id,
    })
  } catch (err) {
    if (err instanceof ExerciseNameTakenError) {
      return { errors: { name: err.message }, values: raw }
    }
    throw err
  }

  redirect("/ejercicios?created=1")
}

export async function updateExerciseAction(
  id: string,
  _prevState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  const user = await requireCoachAuth()
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>
  const parsed = createExerciseSchema.safeParse(raw)

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === "string" && !errors[key]) errors[key] = issue.message
    }
    return { errors, values: raw }
  }

  try {
    await exerciseService.update(
      id,
      {
        name: parsed.data.name,
        primaryMuscle: parsed.data.primaryMuscle,
        secondaryMuscle: parsed.data.secondaryMuscle ?? null,
        videoUrl: parsed.data.videoUrl ?? null,
      },
      user.id,
    )
  } catch (err) {
    if (err instanceof ExerciseNameTakenError) {
      return { errors: { name: err.message }, values: raw }
    }
    throw err
  }

  redirect("/ejercicios?updated=1")
}

export async function deleteExerciseAction(id: string) {
  const user = await requireCoachAuth()
  try {
    await exerciseService.delete(id, user.id)
  } catch (err) {
    if (err instanceof ExerciseInUseError) {
      redirect(`/ejercicios/${id}?deleteError=in-use`)
    }
    throw err
  }

  redirect("/ejercicios?deleted=1")
}

// ─────────────────────────────────────────────
// SUPERADMIN MASTER EXERCISE ACTIONS
// ─────────────────────────────────────────────

export async function createMasterExerciseAction(data: {
  name: string
  primaryMuscle: string
  secondaryMuscle?: string
  videoUrl?: string
}) {
  await requireSuperAdminAuth()
  const parsed = createExerciseSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const created = await exerciseService.create({
      ...parsed.data,
      trainerId: null, // Master Catalog
    })
    revalidatePath("/superadmin/ejercicios")
    return { success: true, data: created }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof ExerciseNameTakenError
          ? err.message
          : "Error al crear ejercicio en el catálogo maestro",
    }
  }
}

export async function updateMasterExerciseAction(
  id: string,
  data: {
    name: string
    primaryMuscle: string
    secondaryMuscle?: string
    videoUrl?: string
  },
) {
  await requireSuperAdminAuth()
  const parsed = createExerciseSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const updated = await exerciseService.update(
      id,
      {
        name: parsed.data.name,
        primaryMuscle: parsed.data.primaryMuscle,
        secondaryMuscle: parsed.data.secondaryMuscle ?? null,
        videoUrl: parsed.data.videoUrl ?? null,
      },
      null, // SuperAdmin editing master in place
    )
    revalidatePath("/superadmin/ejercicios")
    return { success: true, data: updated }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof ExerciseNameTakenError
          ? err.message
          : "Error al actualizar ejercicio maestro",
    }
  }
}

export async function deleteMasterExerciseAction(id: string) {
  await requireSuperAdminAuth()
  try {
    await exerciseService.delete(id, null)
    revalidatePath("/superadmin/ejercicios")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof ExerciseInUseError
          ? err.message
          : "Error al eliminar el ejercicio maestro",
    }
  }
}
