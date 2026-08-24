"use client"

import { useState } from "react"
import { Edit3, History, Loader2, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  batchLogWeightsAction,
  getStudentProgressHistoryAction,
} from "@/lib/actions/progress.actions"
import type { RoutineDetailBlock } from "@/lib/services/assigned-routine.service"
import type { ProgressHistoryEntry, ProgressLogEntry } from "@/lib/repositories/interfaces"

export function DayWeightsDialogs({
  dni,
  assignedRoutineId,
  blocks,
  progressByBlock,
}: {
  dni: string
  assignedRoutineId: string
  blocks: RoutineDetailBlock[]
  progressByBlock: Map<string, ProgressLogEntry>
}) {
  // Register weights state
  const [registerOpen, setRegisterOpen] = useState(false)
  const [weights, setWeights] = useState<Record<string, { weight: string; notes: string }>>(() => {
    const initial: Record<string, { weight: string; notes: string }> = {}
    for (const b of blocks) {
      const p = progressByBlock.get(b.id)
      initial[b.id] = {
        weight: p?.weightKg !== undefined && p?.weightKg !== null ? String(p.weightKg) : "",
        notes: p?.studentNotes ?? "",
      }
    }
    return initial
  })
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // History state
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyItems, setHistoryItems] = useState<ProgressHistoryEntry[]>([])

  async function handleOpenHistory(open: boolean) {
    setHistoryOpen(open)
    if (open) {
      setHistoryLoading(true)
      const res = await getStudentProgressHistoryAction(dni)
      if (res.ok) {
        // Filter history by this day's block IDs or show relevant entries
        const blockIds = new Set(blocks.map((b) => b.id))
        const filtered = res.items.filter((item) => blockIds.has(item.exerciseBlockId))
        setHistoryItems(filtered.length > 0 ? filtered : res.items)
      }
      setHistoryLoading(false)
    }
  }

  async function handleSaveWeights(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSavedSuccess(false)

    const entries = blocks.map((b) => ({
      exerciseBlockId: b.id,
      weightKg: weights[b.id]?.weight ? Number(weights[b.id].weight) : null,
      studentNotes: weights[b.id]?.notes?.trim() || null,
    }))

    const res = await batchLogWeightsAction({
      dni,
      assignedRoutineId,
      entries,
    })

    setSaving(false)
    if (res.ok) {
      setSavedSuccess(true)
      setTimeout(() => {
        setRegisterOpen(false)
        setSavedSuccess(false)
      }, 1200)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border/60 pb-3 pt-1">
      {/* Botón Registrar Pesos */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogTrigger render={
          <button
            type="button"
            className="flex min-h-10 items-center gap-2 rounded-lg bg-[#555e69] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#434b54] active:scale-95"
          />
        }>
          <Edit3 className="size-4" />
          Registrar Pesos
        </DialogTrigger>

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Pesos de la Sesión</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveWeights} className="mt-3 flex flex-col gap-4">
            {blocks.map((block) => (
              <div key={block.id} className="rounded-xl border bg-muted/20 p-3">
                <p className="font-semibold text-foreground">{block.exerciseName}</p>
                <p className="text-xs text-muted-foreground">
                  {block.sets} series {block.repsScheme ? `(${block.repsScheme})` : block.reps ? `× ${block.reps} reps` : ""}
                </p>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`w-${block.id}`} className="text-xs">Peso utilizado (kg)</Label>
                    <Input
                      id={`w-${block.id}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.5"
                      placeholder="Ej: 60"
                      value={weights[block.id]?.weight ?? ""}
                      onChange={(e) =>
                        setWeights((prev) => ({
                          ...prev,
                          [block.id]: { ...prev[block.id], weight: e.target.value },
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`n-${block.id}`} className="text-xs">Notas por serie / carga</Label>
                    <Input
                      id={`n-${block.id}`}
                      placeholder="Ej: 50, 55, 60, 60"
                      value={weights[block.id]?.notes ?? ""}
                      onChange={(e) =>
                        setWeights((prev) => ({
                          ...prev,
                          [block.id]: { ...prev[block.id], notes: e.target.value },
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRegisterOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving || savedSuccess}
                className="bg-primary text-primary-foreground"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Guardando...
                  </>
                ) : savedSuccess ? (
                  <>
                    <Check className="mr-2 size-4" /> ¡Guardado!
                  </>
                ) : (
                  "Guardar pesos"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Botón Historial de Pesos */}
      <Dialog open={historyOpen} onOpenChange={handleOpenHistory}>
        <DialogTrigger render={
          <button
            type="button"
            className="flex min-h-10 items-center gap-2 rounded-lg border border-primary/80 bg-background px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary/5 active:scale-95"
          />
        }>
          <History className="size-4" />
          Historial de Pesos
        </DialogTrigger>

        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Historial de Pesos</DialogTitle>
          </DialogHeader>

          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : historyItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Todavía no hay registros de peso guardados para estos ejercicios.
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-2">
              {historyItems.map((item, idx) => (
                <div
                  key={`${item.exerciseBlockId}-${idx}`}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.exerciseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(item.loggedDate))}
                      {item.studentNotes ? ` · ${item.studentNotes}` : ""}
                    </p>
                  </div>
                  {item.weightKg !== null ? (
                    <span className="font-heading text-base font-semibold text-primary">
                      {item.weightKg} kg
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin peso</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
