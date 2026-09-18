"use client"

import { useState } from "react"
import { Plus, Pencil, Loader2 } from "lucide-react"
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
import {
  createMasterExerciseAction,
  updateMasterExerciseAction,
} from "@/lib/actions/exercise.actions"
import { createExerciseSchema } from "@/lib/validators/exercise"

interface ExerciseDialogProps {
  mode: "create" | "edit"
  exercise?: {
    id: string
    name: string
    primaryMuscle: string
    secondaryMuscle: string | null
    videoUrl: string | null
  }
}

export function ExerciseDialog({ mode, exercise }: ExerciseDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [values, setValues] = useState({
    name: exercise?.name || "",
    primaryMuscle: exercise?.primaryMuscle || "",
    secondaryMuscle: exercise?.secondaryMuscle || "",
    videoUrl: exercise?.videoUrl || "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const parsed = createExerciseSchema.safeParse(values)
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === "string" && !nextErrors[key]) {
          nextErrors[key] = issue.message
        }
      }
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      if (mode === "create") {
        const res = await createMasterExerciseAction(parsed.data)
        if (res.success) {
          toast.success("Ejercicio agregado al catálogo maestro")
          setValues({
            name: "",
            primaryMuscle: "",
            secondaryMuscle: "",
            videoUrl: "",
          })
          setOpen(false)
        } else {
          toast.error(res.error || "Error al crear ejercicio")
        }
      } else if (exercise?.id) {
        const res = await updateMasterExerciseAction(exercise.id, parsed.data)
        if (res.success) {
          toast.success("Ejercicio maestro actualizado")
          setOpen(false)
        } else {
          toast.error(res.error || "Error al actualizar ejercicio")
        }
      }
    } catch {
      toast.error("Ocurrió un error inesperado")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          mode === "create" ? (
            <Button className="gap-2">
              <Plus className="size-4" />
              Nuevo Ejercicio Maestro
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <Pencil className="size-3.5" />
              Editar
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Agregar Ejercicio al Catálogo Maestro"
              : `Editar: ${exercise?.name}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Este ejercicio estará disponible en la biblioteca de todos los profesores de la plataforma."
              : "Los cambios se reflejarán en el catálogo maestro."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre del Ejercicio *</Label>
            <Input
              id="name"
              name="name"
              value={values.name}
              onChange={handleChange}
              placeholder="Ej: Press de Banca Plano"
              disabled={isSubmitting}
              required
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="primaryMuscle">Músculo Primario *</Label>
            <Input
              id="primaryMuscle"
              name="primaryMuscle"
              value={values.primaryMuscle}
              onChange={handleChange}
              placeholder="Ej: Pectoral mayor"
              disabled={isSubmitting}
              required
            />
            {errors.primaryMuscle && (
              <p className="text-xs text-destructive">{errors.primaryMuscle}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="secondaryMuscle">Músculo Secundario (Opcional)</Label>
            <Input
              id="secondaryMuscle"
              name="secondaryMuscle"
              value={values.secondaryMuscle}
              onChange={handleChange}
              placeholder="Ej: Deltoides anterior, tríceps"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="videoUrl">URL del Video Demostrativo</Label>
            <Input
              id="videoUrl"
              name="videoUrl"
              value={values.videoUrl}
              onChange={handleChange}
              placeholder="https://www.youtube.com/..."
              disabled={isSubmitting}
            />
            {errors.videoUrl && (
              <p className="text-xs text-destructive">{errors.videoUrl}</p>
            )}
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
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {mode === "create" ? "Crear Ejercicio" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
