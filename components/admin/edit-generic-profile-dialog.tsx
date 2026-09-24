"use client"

import { useState } from "react"
import { Pencil, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updateGenericProfileAction } from "@/lib/actions/generic-profile.actions"

interface EditGenericProfileDialogProps {
  profile: {
    id: string
    name: string
  }
}

export function EditGenericProfileDialog({ profile }: EditGenericProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState(profile.name)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.")
      return
    }

    if (password && password.trim().length < 6) {
      setError("La nueva clave debe tener al menos 6 caracteres.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await updateGenericProfileAction({
        id: profile.id,
        name: name.trim(),
        password: password.trim() || undefined,
      })

      if (res.ok) {
        toast.success("Alumno genérico actualizado exitosamente.")
        setPassword("")
        setOpen(false)
      } else {
        setError(res.error || "No se pudo actualizar el alumno genérico.")
      }
    } catch {
      setError("Ocurrió un error inesperado.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="size-3.5" />
            Editar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Alumno Genérico</DialogTitle>
          <DialogDescription>
            Modificá el nombre identificatorio o actualizá la clave de acceso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor={`edit-name-${profile.id}`}>Nombre descriptivo *</Label>
            <Input
              id={`edit-name-${profile.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`edit-password-${profile.id}`}>Nueva clave (dejar en blanco para no cambiar)</Label>
            <Input
              id={`edit-password-${profile.id}`}
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nueva clave opcional"
              disabled={isSubmitting}
            />
            <p className="text-[11px] text-muted-foreground">
              Mínimo 6 caracteres si deseás cambiarla.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
