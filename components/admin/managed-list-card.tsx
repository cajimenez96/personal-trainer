"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type LabelOption = { id: string; label: string }
type ActionState = { ok: boolean; error?: string }

// Reused by Objetivo y Modalidad (HU-40) — mismo shape (id + label),
// mismas operaciones. Las tablas y servicios detrás quedan separados por
// entidad; esta es solo la capa de presentación, que sí es idéntica.
export function ManagedListCard({
  title,
  items,
  createAction,
  renameAction,
  deleteAction,
}: {
  title: string
  items: LabelOption[]
  createAction: (label: string) => Promise<ActionState>
  renameAction: (id: string, label: string) => Promise<ActionState>
  deleteAction: (id: string) => Promise<ActionState>
}) {
  const router = useRouter()
  const [newLabel, setNewLabel] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<LabelOption | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newLabel.trim()) return
    setPending(true)
    setError(null)
    const result = await createAction(newLabel.trim())
    setPending(false)
    if (!result.ok) {
      setError(result.error ?? "No se pudo crear.")
      return
    }
    setNewLabel("")
    router.refresh()
  }

  function startEdit(item: LabelOption) {
    setEditingId(item.id)
    setEditingLabel(item.label)
    setError(null)
  }

  async function handleRename(id: string) {
    if (!editingLabel.trim()) return
    setPending(true)
    setError(null)
    const result = await renameAction(id, editingLabel.trim())
    setPending(false)
    if (!result.ok) {
      setError(result.error ?? "No se pudo renombrar.")
      return
    }
    setEditingId(null)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setPending(true)
    setError(null)
    const result = await deleteAction(deleteTarget.id)
    setPending(false)
    setDeleteTarget(null)
    if (!result.ok) {
      setError(result.error ?? "No se pudo eliminar.")
    } else {
      router.refresh()
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin opciones cargadas todavía.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm"
                >
                  {editingId === item.id ? (
                    <>
                      <Input
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        className="h-7"
                        autoFocus
                      />
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={pending}
                          onClick={() => handleRename(item.id)}
                          aria-label="Guardar"
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => setEditingId(null)}
                          aria-label="Cancelar"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span>{item.label}</span>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => startEdit(item)}
                          aria-label={`Editar ${item.label}`}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => {
                            setError(null)
                            setDeleteTarget(item)
                          }}
                          aria-label={`Eliminar ${item.label}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Nueva opción"
              className="h-8"
            />
            <Button type="submit" variant="secondary" size="sm" disabled={pending}>
              Agregar
            </Button>
          </form>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar "{deleteTarget?.label}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Si algún alumno tiene esta opción asignada, no
              se va a poder eliminar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
