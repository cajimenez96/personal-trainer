"use client"

import { useId, useState } from "react"
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createTemplateAction, updateTemplateAction } from "@/lib/actions/routine-template.actions"
import type { CreateTemplatePayload } from "@/lib/validators/routine-template"

type BlockState = {
  key: string
  exerciseId: string
  sets: string
  reps: string
  durationSecs: string
  restSecs: string
  trainerNotes: string
}

type DayState = {
  key: string
  label: string
  blocks: BlockState[]
}

function emptyBlock(key: string): BlockState {
  return { key, exerciseId: "", sets: "", reps: "", durationSecs: "", restSecs: "", trainerNotes: "" }
}

export type TemplateInitialValues = {
  name: string
  description: string
  durationWeeks: string
  days: {
    label: string
    blocks: {
      exerciseId: string
      sets: string
      reps: string
      durationSecs: string
      restSecs: string
      trainerNotes: string
    }[]
  }[]
}

export function TemplateBuilder({
  exercises,
  mode = "create",
  templateId,
  initial,
}: {
  exercises: { id: string; name: string; primaryMuscle: string }[]
  mode?: "create" | "edit"
  templateId?: string
  initial?: TemplateInitialValues
}) {
  const uid = useId()
  const [name, setName] = useState(initial?.name ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [durationWeeks, setDurationWeeks] = useState(initial?.durationWeeks ?? "4")
  const [days, setDays] = useState<DayState[]>(() =>
    (initial?.days ?? []).map((day, dayIndex) => ({
      key: `initial-day-${dayIndex}`,
      label: day.label,
      blocks: day.blocks.map((block, blockIndex) => ({
        key: `initial-block-${dayIndex}-${blockIndex}`,
        ...block,
      })),
    })),
  )
  const [preview, setPreview] = useState(false)
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  let keyCounter = 0
  const nextKey = () => `${uid}-${keyCounter++}`

  function addDay() {
    setDays((prev) => [
      ...prev,
      { key: nextKey(), label: `Día ${prev.length + 1}`, blocks: [] },
    ])
  }

  function removeDay(dayIndex: number) {
    setDays((prev) => prev.filter((_, i) => i !== dayIndex))
  }

  function updateDayLabel(dayIndex: number, label: string) {
    setDays((prev) => prev.map((d, i) => (i === dayIndex ? { ...d, label } : d)))
  }

  function addBlock(dayIndex: number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex ? { ...d, blocks: [...d.blocks, emptyBlock(nextKey())] } : d,
      ),
    )
  }

  function removeBlock(dayIndex: number, blockIndex: number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex ? { ...d, blocks: d.blocks.filter((_, j) => j !== blockIndex) } : d,
      ),
    )
  }

  function updateBlock(dayIndex: number, blockIndex: number, patch: Partial<BlockState>) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex
          ? {
              ...d,
              blocks: d.blocks.map((b, j) => (j === blockIndex ? { ...b, ...patch } : b)),
            }
          : d,
      ),
    )
  }

  function moveBlock(dayIndex: number, blockIndex: number, direction: -1 | 1) {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d
        const target = blockIndex + direction
        if (target < 0 || target >= d.blocks.length) return d
        const blocks = [...d.blocks]
        ;[blocks[blockIndex], blocks[target]] = [blocks[target], blocks[blockIndex]]
        return { ...d, blocks }
      }),
    )
  }

  function toPayload(): CreateTemplatePayload {
    return {
      name,
      description: description || undefined,
      durationWeeks,
      days: days.map((d) => ({
        label: d.label,
        blocks: d.blocks.map((b) => ({
          exerciseId: b.exerciseId,
          sets: b.sets,
          reps: b.reps || undefined,
          durationSecs: b.durationSecs || undefined,
          restSecs: b.restSecs || undefined,
          trainerNotes: b.trainerNotes || undefined,
        })),
      })),
    }
  }

  async function handleSave() {
    setPending(true)
    setErrors({})
    try {
      const result =
        mode === "edit" && templateId
          ? await updateTemplateAction(templateId, toPayload())
          : await createTemplateAction(toPayload())
      if (!result.ok && result.errors) {
        setErrors(result.errors)
      }
    } finally {
      setPending(false)
    }
  }

  function exerciseName(id: string) {
    return exercises.find((e) => e.id === id)?.name ?? "(sin seleccionar)"
  }

  if (preview) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Vista previa</h2>
          <Button variant="outline" onClick={() => setPreview(false)}>
            Volver a editar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{name || "(sin nombre)"}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            <p className="text-sm">Duración: {durationWeeks || "—"} semanas</p>

            {days.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin días agregados todavía.</p>
            )}

            {days.map((day) => (
              <div key={day.key} className="rounded-md border p-4">
                <p className="font-medium">{day.label}</p>
                {day.blocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin ejercicios.</p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-1 text-sm">
                    {day.blocks.map((block) => (
                      <li key={block.key}>
                        {exerciseName(block.exerciseId)} — {block.sets || "?"} series
                        {block.reps && ` × ${block.reps} reps`}
                        {block.durationSecs && ` · ${block.durationSecs}s`}
                        {block.restSecs && ` · descanso ${block.restSecs}s`}
                        {block.trainerNotes && ` — "${block.trainerNotes}"`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={pending} className="w-full sm:w-auto">
          {pending ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Guardar plantilla"}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos de la plantilla</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="template-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="template-description">Descripción</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="template-duration">Duración (semanas)</Label>
            <Input
              id="template-duration"
              type="number"
              min={1}
              className="w-32"
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              aria-invalid={!!errors.durationWeeks}
            />
            {errors.durationWeeks && (
              <p className="text-sm text-destructive">{errors.durationWeeks}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {days.map((day, dayIndex) => (
          <Card key={day.key}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <Input
                value={day.label}
                onChange={(e) => updateDayLabel(dayIndex, e.target.value)}
                className="max-w-xs font-medium"
              />
              <Button variant="ghost" size="icon" onClick={() => removeDay(dayIndex)}>
                <Trash2 className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {day.blocks.map((block, blockIndex) => (
                <div key={block.key} className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-6">
                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <Label>Ejercicio</Label>
                    <select
                      value={block.exerciseId}
                      onChange={(e) =>
                        updateBlock(dayIndex, blockIndex, { exerciseId: e.target.value })
                      }
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      {exercises.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name} ({ex.primaryMuscle})
                        </option>
                      ))}
                    </select>
                  </div>

                  <NumberField
                    label="Series *"
                    value={block.sets}
                    onChange={(v) => updateBlock(dayIndex, blockIndex, { sets: v })}
                  />
                  <NumberField
                    label="Reps"
                    value={block.reps}
                    onChange={(v) => updateBlock(dayIndex, blockIndex, { reps: v })}
                  />
                  <NumberField
                    label="Duración (seg)"
                    value={block.durationSecs}
                    onChange={(v) => updateBlock(dayIndex, blockIndex, { durationSecs: v })}
                  />
                  <NumberField
                    label="Descanso (seg)"
                    value={block.restSecs}
                    onChange={(v) => updateBlock(dayIndex, blockIndex, { restSecs: v })}
                  />

                  <div className="sm:col-span-5 flex flex-col gap-1">
                    <Label>Notas del trainer</Label>
                    <Input
                      value={block.trainerNotes}
                      onChange={(e) =>
                        updateBlock(dayIndex, blockIndex, { trainerNotes: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex items-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={blockIndex === 0}
                      onClick={() => moveBlock(dayIndex, blockIndex, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={blockIndex === day.blocks.length - 1}
                      onClick={() => moveBlock(dayIndex, blockIndex, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBlock(dayIndex, blockIndex)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button variant="secondary" onClick={() => addBlock(dayIndex)} className="w-fit">
                Agregar ejercicio
              </Button>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={addDay} className="w-fit">
          Agregar día
        </Button>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setPreview(true)}>
          Vista previa
        </Button>
        <Button onClick={handleSave} disabled={pending || !name.trim()}>
          {pending ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Guardar plantilla"}
        </Button>
      </div>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
