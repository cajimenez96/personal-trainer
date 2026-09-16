"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { reactivateStudentAction, type CreateStudentState } from "@/lib/actions/student.actions"
import {
  NIVEL_VALUES,
  NIVEL_LABEL,
  ACCESS_OVERRIDE_VALUES,
  ACCESS_OVERRIDE_LABEL,
  createStudentSchema,
  updateStudentSchema,
} from "@/lib/validators/student"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

const NIVEL_ITEMS = NIVEL_VALUES.map((value) => ({ value, label: NIVEL_LABEL[value] }))
const ACCESS_OVERRIDE_ITEMS = ACCESS_OVERRIDE_VALUES.map((value) => ({
  value,
  label: ACCESS_OVERRIDE_LABEL[value],
}))

const initialState: CreateStudentState = {}

function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10)
}

type StudentFormAction = (
  state: CreateStudentState,
  formData: FormData,
) => Promise<CreateStudentState>

export function StudentForm({
  mode,
  action,
  defaultValues,
  objetivos,
  modalidades,
}: {
  mode: "create" | "edit"
  action: StudentFormAction
  defaultValues?: Record<string, string>
  objetivos: { id: string; label: string }[]
  modalidades: { id: string; label: string }[]
}) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const [userValues, setUserValues] = useState<Record<string, string>>({})

  const getValue = (fieldName: string, fallbackDefault?: string) => {
    if (fieldName in userValues) {
      return userValues[fieldName]
    }
    if (state.values && fieldName in state.values) {
      return state.values[fieldName] ?? ""
    }
    if (defaultValues && fieldName in defaultValues) {
      return defaultValues[fieldName] ?? ""
    }
    return fallbackDefault ?? ""
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setUserValues((prev) => ({ ...prev, [name]: value }))
  }

  const errors = { ...state.errors, ...clientErrors }
  const schema = mode === "create" ? createStudentSchema : updateStudentSchema

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget)
    const raw = Object.fromEntries(data.entries())
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
      {state.existingStudent && (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <div>
            <p className="font-semibold text-foreground">
              Ya existe un alumno registrado con DNI {state.existingStudent.dni}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              <span className="font-medium text-foreground">{state.existingStudent.name}</span> está actualmente como{" "}
              <Badge variant={state.existingStudent.isActive ? "success" : "destructive"} className="ml-1">
                {state.existingStudent.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              type="button"
              render={<Link href={`/alumnos/${state.existingStudent.id}`} />}
            >
              Ver ficha y editar
            </Button>
            {!state.existingStudent.isActive && (
              <Button
                size="sm"
                type="button"
                onClick={() => reactivateStudentAction(state.existingStudent!.id)}
              >
                Reactivar alumno
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Nombre"
          name="firstName"
          required
          error={errors.firstName}
          value={getValue("firstName")}
          onChange={handleChange}
        />
        <Field
          label="Apellido"
          name="lastName"
          required
          error={errors.lastName}
          value={getValue("lastName")}
          onChange={handleChange}
        />
        {mode === "create" ? (
          <Field
            label="DNI"
            name="dni"
            required
            error={errors.dni}
            value={getValue("dni")}
            onChange={handleChange}
            inputMode="numeric"
          />
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="dni">DNI</Label>
            <Input id="dni" value={getValue("dni")} disabled readOnly />
            <p className="text-xs text-muted-foreground">
              El DNI es el identificador público del alumno y no puede modificarse.
            </p>
          </div>
        )}
        <Field
          label="Email"
          name="email"
          type="email"
          error={errors.email}
          value={getValue("email")}
          onChange={handleChange}
        />
        <Field
          label="Teléfono"
          name="phone"
          error={errors.phone}
          value={getValue("phone")}
          onChange={handleChange}
        />
        <Field
          label="Fecha inicio membresía"
          name="membershipStartsAt"
          type="date"
          required
          error={errors.membershipStartsAt}
          value={getValue("membershipStartsAt", mode === "create" ? todayDateInputValue() : "")}
          onChange={handleChange}
        />
        <Field
          label="Fecha venc. cuota"
          name="paymentExpiresAt"
          type="date"
          error={errors.paymentExpiresAt}
          value={getValue("paymentExpiresAt")}
          onChange={handleChange}
        />

        <SelectField
          label="Objetivo"
          name="objetivoId"
          items={objetivos.map((o) => ({ value: o.id, label: o.label }))}
          value={getValue("objetivoId")}
          onChange={handleChange}
          error={errors.objetivoId}
        />
        <Field
          label="Objetivos secundarios / prioridades"
          name="secondaryGoals"
          error={errors.secondaryGoals}
          value={getValue("secondaryGoals")}
          onChange={handleChange}
          placeholder="Ej: mejorar sentadilla, espalda"
        />
        <SelectField
          label="Nivel"
          name="nivel"
          items={NIVEL_ITEMS}
          value={getValue("nivel")}
          onChange={handleChange}
          error={errors.nivel}
        />
        <SelectField
          label="Modalidad"
          name="modalidadId"
          items={modalidades.map((m) => ({ value: m.id, label: m.label }))}
          value={getValue("modalidadId")}
          onChange={handleChange}
          error={errors.modalidadId}
        />
        <SelectField
          label="Control de Acceso al Portal"
          name="accessOverride"
          items={ACCESS_OVERRIDE_ITEMS}
          value={getValue("accessOverride", "auto")}
          onChange={handleChange}
          error={errors.accessOverride}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="healthNotes">Notas de salud</Label>
        <Textarea
          id="healthNotes"
          name="healthNotes"
          value={getValue("healthNotes")}
          onChange={handleChange}
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
  value,
  onChange,
  required,
  type = "text",
  inputMode,
  placeholder,
}: {
  label: string
  name: string
  error?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
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
        value={value ?? ""}
        onChange={onChange}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={!!error}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

function SelectField({
  label,
  name,
  items,
  value,
  onChange,
  error,
}: {
  label: string
  name: string
  items: { value: string; label: string }[]
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  error?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Sin especificar</option>
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
