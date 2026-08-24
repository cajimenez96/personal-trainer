"use client";

import { useId, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Info, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  createTemplateAction,
  updateTemplateAction,
} from "@/lib/actions/routine-template.actions";
import type { CreateTemplatePayload } from "@/lib/validators/routine-template";
import { groupConsecutiveBlocks } from "@/lib/utils/group-blocks";

type BlockState = {
  key: string;
  id?: string;
  exerciseId: string;
  sets: string;
  reps: string;
  repsScheme: string;
  weightKg: string;
  intensity: string;
  tempo: string;
  durationSecs: string;
  restSecs: string;
  trainerNotes: string;
  groupLabel: string;
  groupRestSecs: string;
};

type DayState = {
  key: string;
  id?: string;
  label: string;
  blocks: BlockState[];
};

// Explica cada campo avanzado en su tooltip — se muestran solo al desplegar
// "Opciones avanzadas" en cada ejercicio, para no abrumar el caso común.
const FIELD_INFO = {
  repsScheme:
    "Usalo cuando las repeticiones cambian de serie a serie, por ejemplo \"1x6 2x5 1x4\". Si lo completás, reemplaza al campo Reps en lo que ve el alumno.",
  durationSecs:
    "Para ejercicios por tiempo en vez de repeticiones (planchas, isométricos, etc.).",
  intensity:
    "Esfuerzo percibido tipo RPE/RIR, por ejemplo \"@7\". Es texto libre, no una escala fija.",
  tempo:
    "Ritmo de ejecución, por ejemplo \"3-1-1-0\" (excéntrica-pausa-concéntrica-pausa) o una palabra como \"controlado\".",
  groupLabel:
    "Agrupa este ejercicio con otros que tengan la misma letra, en orden consecutivo dentro del día, para formar una superserie o circuito.",
  groupRestSecs:
    "Descanso que se toma recién al terminar todos los ejercicios del grupo, no después de cada uno. Solo tiene efecto si completaste \"Grupo\".",
  trainerNotes:
    "Comentario visible para el alumno junto a este ejercicio (técnica, aclaraciones, etc.).",
} as const;

function hasAdvancedValues(block: BlockState) {
  return !!(
    block.repsScheme ||
    block.durationSecs ||
    block.intensity ||
    block.tempo ||
    block.groupLabel ||
    block.groupRestSecs ||
    block.trainerNotes
  );
}

function emptyBlock(key: string): BlockState {
  return {
    key,
    exerciseId: "",
    sets: "",
    reps: "",
    repsScheme: "",
    weightKg: "",
    intensity: "",
    tempo: "",
    durationSecs: "",
    restSecs: "",
    trainerNotes: "",
    groupLabel: "",
    groupRestSecs: "",
  };
}

export type TemplateInitialValues = {
  name: string;
  description: string;
  durationWeeks: string;
  days: {
    id?: string;
    label: string;
    blocks: {
      id?: string;
      exerciseId: string;
      sets: string;
      reps: string;
      repsScheme: string;
      weightKg: string;
      intensity: string;
      tempo: string;
      durationSecs: string;
      restSecs: string;
      trainerNotes: string;
      groupLabel: string;
      groupRestSecs: string;
    }[];
  }[];
};

export function TemplateBuilder({
  exercises,
  mode = "create",
  templateId,
  initial,
}: {
  exercises: { id: string; name: string; primaryMuscle: string }[];
  mode?: "create" | "edit";
  templateId?: string;
  initial?: TemplateInitialValues;
}) {
  const uid = useId();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [durationWeeks, setDurationWeeks] = useState(
    initial?.durationWeeks ?? "4",
  );
  const [days, setDays] = useState<DayState[]>(() =>
    (initial?.days ?? []).map((day, dayIndex) => ({
      key: `initial-day-${dayIndex}`,
      id: day.id,
      label: day.label,
      blocks: day.blocks.map((block, blockIndex) => ({
        key: `initial-block-${dayIndex}-${blockIndex}`,
        ...block,
      })),
    })),
  );
  const [preview, setPreview] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  // Bloques cuyas "Opciones avanzadas" están desplegadas — arranca abiertas
  // en las que ya traían algún valor avanzado cargado (editar una plantilla
  // existente no debería esconder datos que ya están ahí).
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(() => {
    const initialSet = new Set<string>();
    for (const day of days) {
      for (const block of day.blocks) {
        if (hasAdvancedValues(block)) initialSet.add(block.key);
      }
    }
    return initialSet;
  });

  function toggleAdvanced(blockKey: string) {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockKey)) next.delete(blockKey);
      else next.add(blockKey);
      return next;
    });
  }

  // A plain local counter resets on every render, so two adds triggered from
  // different render cycles could both compute the same suffix (the bug that
  // caused duplicate React keys). A ref survives across renders instead.
  const keyCounter = useRef(0);
  const nextKey = () => `${uid}-${keyCounter.current++}`;

  function addDay() {
    setDays((prev) => [
      ...prev,
      { key: nextKey(), label: `Día ${prev.length + 1}`, blocks: [] },
    ]);
  }

  function removeDay(dayIndex: number) {
    setDays((prev) => prev.filter((_, i) => i !== dayIndex));
  }

  function updateDayLabel(dayIndex: number, label: string) {
    setDays((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, label } : d)),
    );
  }

  function addBlock(dayIndex: number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex
          ? { ...d, blocks: [...d.blocks, emptyBlock(nextKey())] }
          : d,
      ),
    );
  }

  function removeBlock(dayIndex: number, blockIndex: number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex
          ? { ...d, blocks: d.blocks.filter((_, j) => j !== blockIndex) }
          : d,
      ),
    );
  }

  function updateBlock(
    dayIndex: number,
    blockIndex: number,
    patch: Partial<BlockState>,
  ) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex
          ? {
              ...d,
              blocks: d.blocks.map((b, j) =>
                j === blockIndex ? { ...b, ...patch } : b,
              ),
            }
          : d,
      ),
    );
  }

  function moveBlock(dayIndex: number, blockIndex: number, direction: -1 | 1) {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d;
        const target = blockIndex + direction;
        if (target < 0 || target >= d.blocks.length) return d;
        const blocks = [...d.blocks];
        [blocks[blockIndex], blocks[target]] = [
          blocks[target],
          blocks[blockIndex],
        ];
        return { ...d, blocks };
      }),
    );
  }

  function toPayload(): CreateTemplatePayload {
    return {
      name,
      description: description || undefined,
      durationWeeks,
      days: days.map((d) => ({
        id: d.id,
        label: d.label,
        blocks: d.blocks.map((b) => ({
          id: b.id,
          exerciseId: b.exerciseId,
          sets: b.sets,
          reps: b.reps || undefined,
          repsScheme: b.repsScheme || undefined,
          weightKg: b.weightKg || undefined,
          intensity: b.intensity || undefined,
          tempo: b.tempo || undefined,
          durationSecs: b.durationSecs || undefined,
          restSecs: b.restSecs || undefined,
          trainerNotes: b.trainerNotes || undefined,
          groupLabel: b.groupLabel || undefined,
          groupRestSecs: b.groupRestSecs || undefined,
        })),
      })),
    };
  }

  async function handleSave() {
    setPending(true);
    setErrors({});
    try {
      const result =
        mode === "edit" && templateId
          ? await updateTemplateAction(templateId, toPayload())
          : await createTemplateAction(toPayload());
      if (!result.ok && result.errors) {
        setErrors(result.errors);
      }
    } finally {
      setPending(false);
    }
  }

  function exerciseName(id: string) {
    return exercises.find((e) => e.id === id)?.name ?? "(sin seleccionar)";
  }

  function exerciseComboLabel(id: string) {
    const exercise = exercises.find((e) => e.id === id);
    return exercise ? `${exercise.name} (${exercise.primaryMuscle})` : "";
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
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <p className="text-sm">Duración: {durationWeeks || "—"} semanas</p>

            {days.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sin días agregados todavía.
              </p>
            )}

            {days.map((day) => (
              <div key={day.key} className="rounded-md border p-4">
                <p className="font-medium">{day.label}</p>
                {day.blocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin ejercicios.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-col gap-2 text-sm">
                    {groupConsecutiveBlocks(day.blocks).map(
                      (entry, entryIndex) =>
                        entry.kind === "single" ? (
                          <p key={entry.block.key}>
                            {exerciseName(entry.block.exerciseId)} —{" "}
                            {entry.block.sets || "?"} series
                            {entry.block.repsScheme
                              ? ` (${entry.block.repsScheme})`
                              : entry.block.reps &&
                                ` × ${entry.block.reps} reps`}
                            {entry.block.weightKg &&
                              ` · ${entry.block.weightKg}kg`}
                            {entry.block.intensity &&
                              ` · ${entry.block.intensity}`}
                            {entry.block.tempo &&
                              ` · tempo ${entry.block.tempo}`}
                            {entry.block.durationSecs &&
                              ` · ${entry.block.durationSecs}s`}
                            {entry.block.restSecs &&
                              ` · descanso ${entry.block.restSecs}s`}
                            {entry.block.trainerNotes &&
                              ` — "${entry.block.trainerNotes}"`}
                          </p>
                        ) : (
                          <div
                            key={`group-${entryIndex}-${entry.label}`}
                            className="rounded-md border-l-2 border-primary bg-muted/30 p-2"
                          >
                            <p className="text-xs font-semibold text-primary">
                              Bloque {entry.label} (superserie)
                            </p>
                            <ul className="mt-1 flex flex-col gap-1">
                              {entry.blocks.map((block) => (
                                <li key={block.key}>
                                  {exerciseName(block.exerciseId)} —{" "}
                                  {block.sets || "?"} series
                                  {block.repsScheme
                                    ? ` (${block.repsScheme})`
                                    : block.reps && ` × ${block.reps} reps`}
                                  {block.weightKg && ` · ${block.weightKg}kg`}
                                  {block.intensity && ` · ${block.intensity}`}
                                  {block.tempo && ` · tempo ${block.tempo}`}
                                  {block.trainerNotes &&
                                    ` — "${block.trainerNotes}"`}
                                </li>
                              ))}
                            </ul>
                            {entry.blocks[entry.blocks.length - 1]
                              .groupRestSecs && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Descanso post-bloque:{" "}
                                {
                                  entry.blocks[entry.blocks.length - 1]
                                    .groupRestSecs
                                }
                                s
                              </p>
                            )}
                          </div>
                        ),
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {errors.general && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errors.general}
          </p>
        )}
        <Button
          onClick={handleSave}
          disabled={pending}
          className="w-full sm:w-auto"
        >
          {pending
            ? "Guardando..."
            : mode === "edit"
              ? "Guardar cambios"
              : "Guardar plantilla"}
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
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
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <Input
                value={day.label}
                onChange={(e) => updateDayLabel(dayIndex, e.target.value)}
                className="max-w-xs font-medium"
              />
              <Button
                variant="destructive"
                size="icon"
                onClick={() => removeDay(dayIndex)}
              >
                <Trash2 className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {day.blocks.map((block, blockIndex) => {
                const expanded = expandedBlocks.has(block.key);
                return (
                  <div key={block.key} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Ejercicio {blockIndex + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          disabled={blockIndex === 0}
                          onClick={() => moveBlock(dayIndex, blockIndex, -1)}
                          aria-label="Mover arriba"
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          disabled={blockIndex === day.blocks.length - 1}
                          onClick={() => moveBlock(dayIndex, blockIndex, 1)}
                          aria-label="Mover abajo"
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={() => removeBlock(dayIndex, blockIndex)}
                          aria-label="Eliminar ejercicio"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Esenciales: lo que se completa en casi todos los ejercicios. */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                      <div className="sm:col-span-2 flex flex-col gap-1">
                        <Label>Ejercicio</Label>
                        <Combobox
                          items={exercises.map((ex) => ex.id)}
                          itemToStringLabel={(id) => exerciseComboLabel(id)}
                          value={block.exerciseId || null}
                          onValueChange={(value) =>
                            updateBlock(dayIndex, blockIndex, {
                              exerciseId: value ?? "",
                            })
                          }
                        >
                          <ComboboxInput placeholder="Buscar ejercicio..." />
                          <ComboboxContent>
                            <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
                            <ComboboxList>
                              {(id: string) => (
                                <ComboboxItem key={id} value={id}>
                                  {exerciseComboLabel(id)}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                      </div>

                      <NumberField
                        label="Series *"
                        value={block.sets}
                        onChange={(v) =>
                          updateBlock(dayIndex, blockIndex, { sets: v })
                        }
                      />
                      <NumberField
                        label="Reps"
                        value={block.reps}
                        onChange={(v) =>
                          updateBlock(dayIndex, blockIndex, { reps: v })
                        }
                      />
                      <NumberField
                        label="Peso (kg)"
                        value={block.weightKg}
                        onChange={(v) =>
                          updateBlock(dayIndex, blockIndex, { weightKg: v })
                        }
                      />
                      <NumberField
                        label="Descanso (seg)"
                        value={block.restSecs}
                        onChange={(v) =>
                          updateBlock(dayIndex, blockIndex, { restSecs: v })
                        }
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleAdvanced(block.key)}
                      className="mt-3 flex items-center gap-1 text-sm font-medium text-primary"
                    >
                      {expanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                      Opciones avanzadas
                    </button>

                    {/* Avanzados: casos particulares — esquema variable, superseries, etc. */}
                    {expanded && (
                      <div className="mt-3 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-6">
                        <div className="sm:col-span-3 flex flex-col gap-1">
                          <FieldLabel
                            label="Esquema de reps (si varía por serie)"
                            info={FIELD_INFO.repsScheme}
                          />
                          <Input
                            value={block.repsScheme}
                            placeholder="Ej: 1x6 2x5 1x4"
                            onChange={(e) =>
                              updateBlock(dayIndex, blockIndex, {
                                repsScheme: e.target.value,
                              })
                            }
                          />
                        </div>
                        <NumberField
                          label="Duración (seg)"
                          value={block.durationSecs}
                          onChange={(v) =>
                            updateBlock(dayIndex, blockIndex, { durationSecs: v })
                          }
                          info={FIELD_INFO.durationSecs}
                        />
                        <div className="sm:col-span-2 flex flex-col gap-1">
                          <FieldLabel label="Intensidad" info={FIELD_INFO.intensity} />
                          <Input
                            value={block.intensity}
                            placeholder="Ej: @7"
                            onChange={(e) =>
                              updateBlock(dayIndex, blockIndex, {
                                intensity: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="sm:col-span-2 flex flex-col gap-1">
                          <FieldLabel label="Tempo" info={FIELD_INFO.tempo} />
                          <Input
                            value={block.tempo}
                            placeholder="Ej: 3-1-1-0 o controlado"
                            onChange={(e) =>
                              updateBlock(dayIndex, blockIndex, {
                                tempo: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <FieldLabel label="Grupo (ej. A)" info={FIELD_INFO.groupLabel} />
                          <Input
                            value={block.groupLabel}
                            placeholder="A"
                            maxLength={10}
                            onChange={(e) =>
                              updateBlock(dayIndex, blockIndex, {
                                groupLabel: e.target.value,
                              })
                            }
                          />
                        </div>
                        <NumberField
                          label="Descanso post-bloque (seg)"
                          value={block.groupRestSecs}
                          onChange={(v) =>
                            updateBlock(dayIndex, blockIndex, { groupRestSecs: v })
                          }
                          info={FIELD_INFO.groupRestSecs}
                        />

                        <div className="sm:col-span-6 flex flex-col gap-1">
                          <FieldLabel label="Notas del trainer" info={FIELD_INFO.trainerNotes} />
                          <Input
                            value={block.trainerNotes}
                            onChange={(e) =>
                              updateBlock(dayIndex, blockIndex, {
                                trainerNotes: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <Button
                variant="secondary"
                onClick={() => addBlock(dayIndex)}
                className="w-fit"
              >
                Agregar ejercicio
              </Button>
              <p className="text-xs text-muted-foreground">
                Ejercicios consecutivos con la misma letra de Grupo forman una
                superserie. El descanso post-bloque se toma del último ejercicio
                del grupo.
              </p>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={addDay} className="w-fit">
          Agregar día
        </Button>
      </div>

      {errors.general && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {errors.general}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setPreview(true)}>
          Vista previa
        </Button>
        <Button onClick={handleSave} disabled={pending || !name.trim()}>
          {pending
            ? "Guardando..."
            : mode === "edit"
              ? "Guardar cambios"
              : "Guardar plantilla"}
        </Button>
      </div>
    </div>
    </TooltipProvider>
  );
}

function FieldLabel({ label, info }: { label: string; info?: string }) {
  if (!info) return <Label>{label}</Label>;
  return (
    <div className="flex items-center gap-1">
      <Label>{label}</Label>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Más información sobre ${label}`}
            />
          }
        >
          <Info className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>{info}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  info,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  info?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel label={label} info={info} />
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
