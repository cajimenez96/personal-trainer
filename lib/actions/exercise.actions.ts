"use server"

import { redirect } from "next/navigation"
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

export async function createExerciseAction(
  _prevState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
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
    await exerciseService.create(parsed.data)
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
    await exerciseService.update(id, {
      name: parsed.data.name,
      primaryMuscle: parsed.data.primaryMuscle,
      secondaryMuscle: parsed.data.secondaryMuscle ?? null,
      videoUrl: parsed.data.videoUrl ?? null,
    })
  } catch (err) {
    if (err instanceof ExerciseNameTakenError) {
      return { errors: { name: err.message }, values: raw }
    }
    throw err
  }

  redirect("/ejercicios?updated=1")
}

export async function deleteExerciseAction(id: string) {
  try {
    await exerciseService.delete(id)
  } catch (err) {
    if (err instanceof ExerciseInUseError) {
      redirect(`/ejercicios/${id}?deleteError=in-use`)
    }
    throw err
  }

  redirect("/ejercicios?deleted=1")
}
