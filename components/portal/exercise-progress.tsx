"use client"

import { useRef, useState } from "react"
import { Check } from "lucide-react"
import { logProgressAction } from "@/lib/actions/progress.actions"
import { RestTimer } from "@/components/portal/rest-timer"
import { NOTE_TYPE_VALUES, type NoteType } from "@/lib/validators/progress-note"

const DEBOUNCE_MS = 600
const NOTES_MAX_LENGTH = 500

const NOTE_TYPE_LABEL: Record<NoteType, string> = {
  session: "Sesión normal",
  incident: "Incidencia",
  discomfort: "Molestia",
}

export function ExerciseProgress({
  dni,
  assignedRoutineId,
  exerciseBlockId,
  initialCompleted,
  initialWeightKg,
  initialNotes,
  initialNoteType,
  restSecs,
}: {
  dni: string
  assignedRoutineId: string
  exerciseBlockId: string
  initialCompleted: boolean
  initialWeightKg: number | null
  initialNotes: string | null
  initialNoteType: NoteType | null
  restSecs: number | null
}) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [weight, setWeight] = useState(initialWeightKg !== null ? String(initialWeightKg) : "")
  const [notes, setNotes] = useState(initialNotes ?? "")
  const [noteType, setNoteType] = useState<NoteType | "">(initialNoteType ?? "")
  const [notesOpen, setNotesOpen] = useState(!!initialNotes)
  const [saving, setSaving] = useState(false)
  const [timerVisible, setTimerVisible] = useState(false)
  const [timerKey, setTimerKey] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function save(
    nextCompleted: boolean,
    nextWeight: string,
    nextNotes: string,
    nextNoteType: NoteType | "",
  ) {
    setSaving(true)
    await logProgressAction({
      dni,
      assignedRoutineId,
      exerciseBlockId,
      completed: nextCompleted,
      weightKg: nextWeight ? Number(nextWeight) : null,
      studentNotes: nextNotes.trim() ? nextNotes : null,
      noteType: nextNoteType || null,
    })
    setSaving(false)
  }

  function handleCheckboxChange(checked: boolean) {
    setCompleted(checked)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    save(checked, weight, notes, noteType)
    if (checked && restSecs) {
      setTimerKey((k) => k + 1)
      setTimerVisible(true)
    }
  }

  function handleWeightChange(value: string) {
    setWeight(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(completed, value, notes, noteType), DEBOUNCE_MS)
  }

  function handleNotesChange(value: string) {
    setNotes(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(completed, weight, value, noteType), DEBOUNCE_MS)
  }

  function handleNoteTypeChange(value: NoteType | "") {
    setNoteType(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    save(completed, weight, notes, value)
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <label className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-input has-checked:border-primary has-checked:bg-primary">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => handleCheckboxChange(e.target.checked)}
            aria-label="Marcar ejercicio como completado"
            className="peer sr-only"
          />
          <Check className="hidden size-6 text-primary-foreground peer-checked:block" />
        </label>

        <div className="flex items-center gap-2">
          <label htmlFor={`weight-${exerciseBlockId}`} className="text-sm text-muted-foreground">
            Peso (kg)
          </label>
          <input
            id={`weight-${exerciseBlockId}`}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.5"
            value={weight}
            onChange={(e) => handleWeightChange(e.target.value)}
            className="h-11 w-20 rounded-xl border border-input bg-background px-2 text-center text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {saving && <span className="text-xs text-muted-foreground">Guardando...</span>}
      </div>

      {timerVisible && restSecs && (
        <RestTimer key={timerKey} seconds={restSecs} onDismiss={() => setTimerVisible(false)} />
      )}

      {notesOpen ? (
        <div className="flex flex-col gap-1">
          <select
            value={noteType}
            onChange={(e) => handleNoteTypeChange(e.target.value as NoteType | "")}
            className="h-9 w-fit rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Tipo de nota (opcional)</option>
            {NOTE_TYPE_VALUES.map((value) => (
              <option key={value} value={value}>
                {NOTE_TYPE_LABEL[value]}
              </option>
            ))}
          </select>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            maxLength={NOTES_MAX_LENGTH}
            rows={2}
            placeholder="Ej: molestia en hombro derecho, bajé el peso a 20kg"
            className="min-h-11 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <span className="self-end text-xs text-muted-foreground">
            {notes.length}/{NOTES_MAX_LENGTH}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setNotesOpen(true)}
          className="flex min-h-11 w-fit items-center text-sm font-medium text-primary"
        >
          + Agregar nota
        </button>
      )}
    </div>
  )
}
