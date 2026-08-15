"use client"

import { useActionState, useState } from "react"
import type { CreateStudentState } from "@/lib/actions/student.actions"
import {
  MODALIDAD_VALUES,
  NIVEL_VALUES,
  OBJETIVO_VALUES,
  createStudentSchema,
  updateStudentSchema,
} from "@/lib/validators/student"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const OBJETIVO_LABEL: Record<string, string> = {
  hipertrofia: "Hipertrofia",
  fuerza: "Fuerza",
  descenso: "Descenso",
}

const NIVEL_LABEL: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
}

const MODALIDAD_LABEL: Record<string, string> = {
  gimnasio: "Gimnasio",
  casa: "Casa",
}

const initialState: CreateStudentState = {}

type StudentFormAction = (
  state: CreateStudentState,
  formData: FormData,
) => Promise<CreateStudentState>

export function StudentForm({
  mode,
  action,
  defaultValues,
}: {
  mode: "create" | "edit"
  action: StudentFormAction
  defaultValues?: Record<string, string>
}) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})

  const errors = { ...state.errors, ...clientErrors }
  const values = state.values ?? defaultValues ?? {}
  const schema = mode === "create" ? createStudentSchema : updateStudentSchema

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget)
    const raw = Object.fromEntries(formData.entries())
    const parsed = schema.safeParse(raw)

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nombre" name="firstName" required error={errors.firstName} defaultValue={values.firstName} />
        <Field label="Apellido" name="lastName" required error={errors.lastName} defaultValue={values.lastName} />
        {mode === "create" ? (
          <Field
            label="DNI"
            name="dni"
            required
            error={errors.dni}
            defaultValue={values.dni}
            inputMode="numeric"
          />
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="dni">DNI</Label>
            <Input id="dni" value={values.dni ?? ""} disabled readOnly />
            <p className="text-xs text-muted-foreground">
              El DNI es el identificador público del alumno y no puede modificarse.
            </p>
          </div>
        )}
        <Field label="Email" name="email" type="email" error={errors.email} defaultValue={values.email} />
        <Field label="Teléfono" name="phone" error={errors.phone} defaultValue={values.phone} />
        <Field
          label="Fecha venc. cuota"
          name="paymentExpiresAt"
          type="date"
          error={errors.paymentExpiresAt}
          defaultValue={values.paymentExpiresAt}
        />

        <SelectField
          label="Objetivo"
          name="objetivo"
          options={OBJETIVO_VALUES}
          labels={OBJETIVO_LABEL}
          defaultValue={values.objetivo}
          error={errors.objetivo}
        />
        <SelectField
          label="Nivel"
          name="nivel"
          options={NIVEL_VALUES}
          labels={NIVEL_LABEL}
          defaultValue={values.nivel}
          error={errors.nivel}
        />
        <SelectField
          label="Modalidad"
          name="modalidad"
          options={MODALIDAD_VALUES}
          labels={MODALIDAD_LABEL}
          defaultValue={values.modalidad}
          error={errors.modalidad}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="healthNotes">Notas de salud</Label>
        <Textarea
          id="healthNotes"
          name="healthNotes"
          defaultValue={values.healthNotes}
          rows={3}
        />
        {errors.healthNotes && (
          <p className="text-sm text-destructive">{errors.healthNotes}</p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending
          ? "Guardando..."
          : mode === "create"
            ? "Crear alumno"
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
  inputMode,
}: {
  label: string
  name: string
  error?: string
  defaultValue?: string
  required?: boolean
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
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
        inputMode={inputMode}
        aria-invalid={!!error}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

function SelectField({
  label,
  name,
  options,
  labels,
  defaultValue,
  error,
}: {
  label: string
  name: string
  options: readonly string[]
  labels: Record<string, string>
  defaultValue?: string
  error?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Sin especificar</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
