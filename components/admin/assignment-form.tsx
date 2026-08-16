"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { assignRoutineAction } from "@/lib/actions/assignment.actions"
import type { RoutineTemplateWithFullDays } from "@/lib/repositories/interfaces"

type OverrideState = Record<
  string,
  {
    sets: string
    reps: string
    repsScheme: string
    weightKg: string
    intensity: string
    tempo: string
    durationSecs: string
    restSecs: string
    trainerNotes: string
  }
>

export function AssignmentForm({
  studentId,
  studentName,
  template,
  exerciseNames,
}: {
  studentId: string
  studentName: string
  template: RoutineTemplateWithFullDays
  exerciseNames: Record<string, string>
}) {
  const router = useRouter()
  const [overrides, setOverrides] = useState<OverrideState>({})
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emptyOverride: OverrideState[string] = {
    sets: "",
    reps: "",
    repsScheme: "",
    weightKg: "",
    intensity: "",
    tempo: "",
    durationSecs: "",
    restSecs: "",
    trainerNotes: "",
  }

  function updateOverride(blockId: string, patch: Partial<OverrideState[string]>) {
    setOverrides((prev) => ({
      ...prev,
      [blockId]: { ...(prev[blockId] ?? emptyOverride), ...patch },
    }))
  }

  async function handleConfirm() {
    setPending(true)
    setError(null)
    try {
      const result = await assignRoutineAction({
        studentId,
        templateId: template.id,
        overrides: Object.entries(overrides)
          .filter(([, v]) => Object.values(v).some((val) => val !== ""))
          .map(([exerciseBlockId, v]) => ({
            exerciseBlockId,
            sets: v.sets ? Number(v.sets) : undefined,
            reps: v.reps ? Number(v.reps) : undefined,
            repsScheme: v.repsScheme || undefined,
            weightKg: v.weightKg ? Number(v.weightKg) : undefined,
            intensity: v.intensity || undefined,
            tempo: v.tempo || undefined,
            durationSecs: v.durationSecs ? Number(v.durationSecs) : undefined,
            restSecs: v.restSecs ? Number(v.restSecs) : undefined,
            trainerNotes: v.trainerNotes || undefined,
          })),
      })
      if (!result.ok) setError(result.error ?? "No se pudo asignar la rutina.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Asignar rutina a {studentName}</h1>
        <p className="text-muted-foreground">
          Plantilla: {template.name} · {template.durationWeeks} semanas
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Dejá los campos en blanco para usar el valor de la plantilla. Solo lo que
        completes acá queda guardado como personalización para este alumno — la
        plantilla base no se modifica.
      </p>

      {template.trainingDays.length === 0 && (
        <p className="text-muted-foreground">Esta plantilla todavía no tiene días cargados.</p>
      )}

      {template.trainingDays.map((day) => (
        <Card key={day.id}>
          <CardHeader>
            <CardTitle className="text-base">{day.label}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {day.exerciseBlocks.map((block) => {
              const o = overrides[block.id]
              return (
                <div key={block.id} className="rounded-md border p-3">
                  <p className="mb-2 text-sm font-medium">
                    {exerciseNames[block.exerciseId] ?? "Ejercicio"} — base: {block.sets}{" "}
                    series
                    {block.repsScheme
                      ? ` (${block.repsScheme})`
                      : block.reps
                        ? ` × ${block.reps} reps`
                        : ""}
                    {block.weightKg ? ` · ${block.weightKg}kg` : ""}
                    {block.intensity ? ` · ${block.intensity}` : ""}
                    {block.tempo ? ` · tempo ${block.tempo}` : ""}
                    {block.durationSecs ? ` · ${block.durationSecs}s` : ""}
                    {block.restSecs ? ` · descanso ${block.restSecs}s` : ""}
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <OverrideField
                      label="Series"
                      placeholder={String(block.sets)}
                      value={o?.sets ?? ""}
                      onChange={(v) => updateOverride(block.id, { sets: v })}
                    />
                    <OverrideField
                      label="Reps"
                      placeholder={block.reps ? String(block.reps) : "—"}
                      value={o?.reps ?? ""}
                      onChange={(v) => updateOverride(block.id, { reps: v })}
                    />
                    <OverrideField
                      label="Esquema reps"
                      placeholder={block.repsScheme ?? "—"}
                      value={o?.repsScheme ?? ""}
                      onChange={(v) => updateOverride(block.id, { repsScheme: v })}
                      type="text"
                    />
                    <OverrideField
                      label="Peso (kg)"
                      placeholder={block.weightKg ? String(block.weightKg) : "—"}
                      value={o?.weightKg ?? ""}
                      onChange={(v) => updateOverride(block.id, { weightKg: v })}
                    />
                    <OverrideField
                      label="Intensidad"
                      placeholder={block.intensity ?? "—"}
                      value={o?.intensity ?? ""}
                      onChange={(v) => updateOverride(block.id, { intensity: v })}
                      type="text"
                    />
                    <OverrideField
                      label="Tempo"
                      placeholder={block.tempo ?? "—"}
                      value={o?.tempo ?? ""}
                      onChange={(v) => updateOverride(block.id, { tempo: v })}
                      type="text"
                    />
                    <OverrideField
                      label="Duración (seg)"
                      placeholder={block.durationSecs ? String(block.durationSecs) : "—"}
                      value={o?.durationSecs ?? ""}
                      onChange={(v) => updateOverride(block.id, { durationSecs: v })}
                    />
                    <OverrideField
                      label="Descanso (seg)"
                      placeholder={block.restSecs ? String(block.restSecs) : "—"}
                      value={o?.restSecs ?? ""}
                      onChange={(v) => updateOverride(block.id, { restSecs: v })}
                    />
                    <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                      <Label className="text-xs">Notas</Label>
                      <Input
                        value={o?.trainerNotes ?? ""}
                        onChange={(e) =>
                          updateOverride(block.id, { trainerNotes: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push(`/alumnos/${studentId}/asignar`)}>
          Elegir otra plantilla
        </Button>
        <Button onClick={handleConfirm} disabled={pending}>
          {pending ? "Asignando..." : "Confirmar asignación"}
        </Button>
      </div>
    </div>
  )
}

function OverrideField({
  label,
  placeholder,
  value,
  onChange,
  type = "number",
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  type?: "number" | "text"
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        min={type === "number" ? 0 : undefined}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
