"use client"

import { useActionState, useState } from "react"
import type { ExerciseFormState } from "@/lib/actions/exercise.actions"
import { createExerciseSchema } from "@/lib/validators/exercise"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialState: ExerciseFormState = {}

type ExerciseFormAction = (
  state: ExerciseFormState,
  formData: FormData,
) => Promise<ExerciseFormState>

export function ExerciseForm({
  mode,
  action,
  defaultValues,
}: {
  mode: "create" | "edit"
  action: ExerciseFormAction
  defaultValues?: Record<string, string>
}) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})

  const errors = { ...state.errors, ...clientErrors }
  const values = state.values ?? defaultValues ?? {}

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget)
    const raw = Object.fromEntries(formData.entries())
    const parsed = createExerciseSchema.safeParse(raw)

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === "string" && !nextErrors[key]) nextErrors[key] = issue.message
      }
      setClientErrors(nextErrors)
      event.preventDefault()
      return
    }

    setClientErrors({})
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Nombre" name="name" required error={errors.name} defaultValue={values.name} />
      <Field
        label="Músculo principal"
        name="primaryMuscle"
        required
        error={errors.primaryMuscle}
        defaultValue={values.primaryMuscle}
      />
      <Field
        label="Músculo secundario"
        name="secondaryMuscle"
        error={errors.secondaryMuscle}
        defaultValue={values.secondaryMuscle}
      />
      <Field
        label="URL de video (YouTube o Vimeo)"
        name="videoUrl"
        type="url"
        placeholder="https://www.youtube.com/watch?v=..."
        error={errors.videoUrl}
        defaultValue={values.videoUrl}
      />

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending
          ? "Guardando..."
          : mode === "create"
            ? "Crear ejercicio"
            : "Guardar cambios"}
      </Button>
    </form>
  )
}

function Field({
  label,
  name,
  error,
  defaultValue,
  required,
  type = "text",
  placeholder,
}: {
  label: string
  name: string
  error?: string
  defaultValue?: string
  required?: boolean
  type?: string
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={!!error}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
