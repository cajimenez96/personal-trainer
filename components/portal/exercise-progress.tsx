"use client";

import { useRef, useState } from "react";
import { Check, Square, Loader2 } from "lucide-react";
import { logProgressAction } from "@/lib/actions/progress.actions";
import { RestTimer } from "@/components/portal/rest-timer";
import {
  NOTE_TYPE_VALUES,
  type NoteType,
} from "@/lib/validators/progress-note";

const DEBOUNCE_MS = 600;
const NOTES_MAX_LENGTH = 500;

const NOTE_TYPE_LABEL: Record<NoteType, string> = {
  session: "Sesión normal",
  incident: "Incidencia",
  discomfort: "Molestia",
};

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
  dni: string;
  assignedRoutineId: string;
  exerciseBlockId: string;
  initialCompleted: boolean;
  initialWeightKg: number | null;
  initialNotes: string | null;
  initialNoteType: NoteType | null;
  restSecs: number | null;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [weight, setWeight] = useState(
    initialWeightKg !== null ? String(initialWeightKg) : "",
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [noteType, setNoteType] = useState<NoteType | "">(
    initialNoteType ?? "",
  );
  const [notesOpen, setNotesOpen] = useState(!!initialNotes);
  const [saving, setSaving] = useState(false);
  const [timerVisible, setTimerVisible] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save(
    nextCompleted: boolean,
    nextWeight: string,
    nextNotes: string,
    nextNoteType: NoteType | "",
  ) {
    setSaving(true);
    await logProgressAction({
      dni,
      assignedRoutineId,
      exerciseBlockId,
      completed: nextCompleted,
      weightKg: nextWeight ? Number(nextWeight) : null,
      studentNotes: nextNotes.trim() ? nextNotes : null,
      noteType: nextNoteType || null,
    });
    setSaving(false);
  }

  const effectiveRestSecs = restSecs && restSecs > 0 ? restSecs : 60;

  function handleToggleCompleted() {
    const nextCompleted = !completed;
    setCompleted(nextCompleted);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    save(nextCompleted, weight, notes, noteType);
    if (nextCompleted) {
      setTimerKey((k) => k + 1);
      setTimerVisible(true);
    } else {
      setTimerVisible(false);
    }
  }

  function handleNotesChange(value: string) {
    setNotes(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => save(completed, weight, value, noteType),
      DEBOUNCE_MS,
    );
  }

  function handleNoteTypeChange(value: NoteType | "") {
    setNoteType(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    save(completed, weight, notes, value);
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {/* Botón táctil estilo píldora para marcar ejercicio */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleToggleCompleted}
          aria-label={
            completed ? "Marcar como pendiente" : "Marcar como realizado"
          }
          className={`flex min-h-11 items-center gap-2.5 rounded-2xl border px-4 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
            completed
              ? "border-[#16a34a] bg-[#dcfce7] text-[#16a34a] dark:bg-[#14532d]/40 dark:text-[#86efac]"
              : "border-[#e5e5e5] bg-white text-[#d32f2f] hover:bg-muted/40 dark:border-border dark:bg-card dark:text-red-400"
          }`}
        >
          {completed ? (
            <span className="flex size-5 items-center justify-center rounded-md bg-[#16a34a] text-white">
              <Check className="size-3.5 stroke-[3]" />
            </span>
          ) : (
            <Square className="size-5 stroke-[2] text-[#d32f2f] dark:text-red-400" />
          )}
          <span className="font-semibold">
            {completed ? "Ejercicio realizado" : "Ejercicio a realizar"}
          </span>
          {saving && (
            <Loader2 className="ml-1 size-3.5 animate-spin text-muted-foreground" />
          )}
        </button>

        {!notesOpen && (
          <button
            type="button"
            onClick={() => setNotesOpen(true)}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            + Nota
          </button>
        )}
      </div>

      {timerVisible && (
        <RestTimer
          key={timerKey}
          seconds={effectiveRestSecs}
          onDismiss={() => setTimerVisible(false)}
        />
      )}

      {notesOpen && (
        <div className="mt-1 flex flex-col gap-1.5 rounded-lg border bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <select
              value={noteType}
              onChange={(e) =>
                handleNoteTypeChange(e.target.value as NoteType | "")
              }
              className="h-8 w-fit rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="">Tipo de nota (opcional)</option>
              {NOTE_TYPE_VALUES.map((value) => (
                <option key={value} value={value}>
                  {NOTE_TYPE_LABEL[value]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setNotesOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cerrar
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            maxLength={NOTES_MAX_LENGTH}
            rows={2}
            placeholder="Ej: molestia en hombro derecho, bajé el peso a 20kg"
            className="min-h-11 w-full rounded-lg border border-input bg-background p-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2"
          />
          <span className="self-end text-[10px] text-muted-foreground">
            {notes.length}/{NOTES_MAX_LENGTH}
          </span>
        </div>
      )}
    </div>
  );
}
