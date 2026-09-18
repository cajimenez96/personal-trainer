"use client"

import { useState } from "react"
import { KeyRound, Loader2 } from "lucide-react"
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
  resetCoachPasswordSchema,
  type ResetCoachPasswordInput,
} from "@/lib/validators/superadmin"
import { resetCoachPasswordAction } from "@/lib/actions/superadmin.actions"

interface ResetPasswordDialogProps {
  trainerId: string
  coachName: string
}

export function ResetPasswordDialog({
  trainerId,
  coachName,
}: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const parsed = resetCoachPasswordSchema.safeParse({
      trainerId,
      newPassword,
    })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Contraseña inválida")
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const res = await resetCoachPasswordAction(parsed.data)
      if (res.success) {
        toast.success(`Contraseña actualizada para ${coachName}`)
        setNewPassword("")
        setOpen(false)
      } else {
        toast.error(res.error || "Error al restablecer la contraseña")
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
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            <KeyRound className="size-3.5" />
            Cambiar Clave
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Restablecer Contraseña</DialogTitle>
          <DialogDescription>
            Establecé una nueva contraseña de acceso para el entrenador{" "}
            <strong className="text-foreground">{coachName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Nueva Contraseña *</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (error) setError(null)
              }}
              placeholder="Mínimo 8 caracteres"
              disabled={isSubmitting}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
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
              Guardar Contraseña
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
