"use client"

import { useState } from "react"
import { UserPen, Scale, Calendar, Check, Loader2 } from "lucide-react"
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
import { updateStudentPortalProfileAction } from "@/lib/actions/portal-profile.actions"

function getTodayLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

interface StudentProfileDialogProps {
  dni: string
  coachSlug: string
  studentName: string
  initialHeight?: number | null
  initialAge?: number | null
  latestWeightKg?: number | null
  latestWeightDate?: Date | null
}

export function StudentProfileDialog({
  dni,
  coachSlug,
  studentName,
  initialHeight,
  initialAge,
  latestWeightKg,
  latestWeightDate,
}: StudentProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [height, setHeight] = useState<string>(
    initialHeight ? String(initialHeight) : "",
  )
  const [age, setAge] = useState<string>(initialAge ? String(initialAge) : "")
  const [newWeightKg, setNewWeightKg] = useState<string>("")
  const [weightDate, setWeightDate] = useState<string>(getTodayLocalDate())

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await updateStudentPortalProfileAction({
        coachSlug,
        dni,
        height: height ? Number(height) : null,
        age: age ? Number(age) : null,
        weightKg: newWeightKg ? Number(newWeightKg) : null,
        weightDate: newWeightKg ? weightDate : undefined,
      })

      if (!res.ok) {
        toast.error(res.error || "No se pudo actualizar el perfil.")
        return
      }

      toast.success("Perfil actualizado correctamente.")
      setNewWeightKg("")
      setOpen(false)
    } catch {
      toast.error("Ocurrió un error inesperado al guardar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="Actualizar perfil"
          />
        }
      >
        <UserPen className="size-3.5 text-white/80" />
        Actualizar perfil
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <UserPen className="size-5 text-primary" />
              Perfil de {studentName}
            </DialogTitle>
            <DialogDescription>
              Actualizá tus datos personales o registrá un nuevo peso corporal para
              mantener tu progreso al día.
            </DialogDescription>
          </DialogHeader>

          {/* Resumen actual si existe */}
          <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-3 text-center">
            <div>
              <span className="block text-[11px] font-medium text-muted-foreground uppercase">
                Altura
              </span>
              <span className="font-semibold text-sm">
                {height ? `${height} cm` : "—"}
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-muted-foreground uppercase">
                Edad
              </span>
              <span className="font-semibold text-sm">
                {age ? `${age} años` : "—"}
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-muted-foreground uppercase">
                Último peso
              </span>
              <span className="font-semibold text-sm">
                {latestWeightKg ? `${latestWeightKg} kg` : "—"}
              </span>
              {latestWeightDate && (
                <span className="block text-[10px] text-muted-foreground">
                  {formatDate(latestWeightDate)}
                </span>
              )}
            </div>
          </div>

          {/* Sección 1: Datos Personales */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-foreground tracking-wider uppercase">
              Datos Personales
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="height" className="text-xs">
                  Altura (cm)
                </Label>
                <Input
                  id="height"
                  type="number"
                  inputMode="numeric"
                  min={50}
                  max={260}
                  placeholder="Ej: 175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="age" className="text-xs">
                  Edad
                </Label>
                <Input
                  id="age"
                  type="number"
                  inputMode="numeric"
                  min={5}
                  max={120}
                  placeholder="Ej: 28"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Registrar Nuevo Peso */}
          <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-background/50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground tracking-wider uppercase">
              <Scale className="size-4 text-primary" />
              <span>Registrar Nuevo Peso</span>
            </div>
            <p className="text-[12px] text-muted-foreground">
              Ingresá tu peso corporal y la fecha del pesaje para registrar tu evolución.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newWeight" className="text-xs">
                  Peso (kg)
                </Label>
                <Input
                  id="newWeight"
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  min={20}
                  max={500}
                  placeholder="Ej: 75.5"
                  value={newWeightKg}
                  onChange={(e) => setNewWeightKg(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="weightDate" className="text-xs flex items-center gap-1">
                  <Calendar className="size-3 text-muted-foreground" />
                  Fecha de carga
                </Label>
                <Input
                  id="weightDate"
                  type="date"
                  value={weightDate}
                  onChange={(e) => setWeightDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Por defecto toma el día de hoy, pero podés cambiarla si te pesaste otro día.
            </p>
          </div>

          <DialogFooter className="mt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-1.5">
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  Guardar cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
