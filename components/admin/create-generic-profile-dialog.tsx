"use client"

import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
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
import { createGenericProfileAction } from "@/lib/actions/generic-profile.actions"

interface CreateGenericProfileDialogProps {
  currentCount: number
  maxProfiles: number
  templates: Array<{ id: string; name: string }>
}

export function CreateGenericProfileDialog({
  currentCount,
  maxProfiles,
  templates,
}: CreateGenericProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [error, setError] = useState<string | null>(null)

  const isLimitReached = currentCount >= maxProfiles

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.")
      return
    }

    if (password.trim().length < 6) {
      setError("La clave debe tener al menos 6 caracteres.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createGenericProfileAction({
        name: name.trim(),
        password: password.trim(),
        templateId: templateId || undefined,
      })

      if (res.ok) {
        toast.success(`Alumno genérico "${name}" creado exitosamente`)
        setName("")
        setPassword("")
        setTemplateId("")
        setOpen(false)
      } else {
        setError(res.error || "No se pudo crear el alumno genérico.")
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
          <Button className="gap-2" disabled={isLimitReached}>
            <Plus className="size-4" />
            Nuevo Alumno Genérico
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Alumno Genérico</DialogTitle>
          <DialogDescription>
            Creá un acceso compartido con nombre y contraseña. Cualquier persona que ingrese esta clave podrá ver la rutina asignada sin registrar datos personales.
          </DialogDescription>
        </DialogHeader>

        {isLimitReached ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-500">
            Has alcanzado el límite de {maxProfiles} alumnos genéricos para tu plan. Contactá al administrador para ampliar tu cupo.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="generic-name">Nombre descriptivo *</Label>
              <Input
                id="generic-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Turno Mañana, Desafío Verano, Nivel Inicial"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="generic-password">Clave de acceso *</Label>
              <Input
                id="generic-password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ej: olympia.manana o verano2026"
                disabled={isSubmitting}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Mínimo 6 caracteres. Es la clave que ingresarán los alumnos en el portal.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="generic-template">Rutina asignada (opcional)</Label>
              <select
                id="generic-template"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                disabled={isSubmitting}
                aria-label="Rutina asignada"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Sin asignar (podés asignarla luego)</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
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
                  "Crear Alumno"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
