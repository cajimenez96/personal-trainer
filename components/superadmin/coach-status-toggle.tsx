"use client"

import { useState } from "react"
import { Power, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
import { toggleCoachStatusAction } from "@/lib/actions/superadmin.actions"

interface CoachStatusToggleProps {
  trainerId: string
  coachName: string
  isActive: boolean
  isCurrentAdmin?: boolean
}

export function CoachStatusToggle({
  trainerId,
  coachName,
  isActive,
  isCurrentAdmin,
}: CoachStatusToggleProps) {
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleToggle = async (newStatus: boolean) => {
    setLoading(true)
    try {
      const res = await toggleCoachStatusAction({
        trainerId,
        isActive: newStatus,
      })
      if (res.success) {
        toast.success(
          newStatus
            ? `Entrenador ${coachName} reactivado con éxito`
            : `Entrenador ${coachName} suspendido`,
        )
      } else {
        toast.error(res.error || "Error al actualizar estado")
      }
    } catch {
      toast.error("Ocurrió un error inesperado")
    } finally {
      setLoading(false)
      setDialogOpen(false)
    }
  }

  if (isCurrentAdmin) {
    return (
      <span className="text-xs text-muted-foreground italic px-2 py-1 select-none">
        Cuenta Principal
      </span>
    )
  }

  return (
    <>
      <Button
        variant={isActive ? "outline" : "default"}
        size="sm"
        disabled={loading}
        onClick={() => {
          if (isActive) {
            // Confirm when suspending
            setDialogOpen(true)
          } else {
            // Activate immediately
            handleToggle(true)
          }
        }}
        className={`gap-1.5 text-xs ${
          isActive
            ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 border-amber-200 dark:border-amber-900"
            : "bg-emerald-600 hover:bg-emerald-700 text-white"
        }`}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Power className="size-3.5" />
        )}
        {isActive ? "Suspender" : "Reactivar"}
      </Button>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="size-5" />
              <AlertDialogTitle>¿Suspender entrenador?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2">
              <p>
                Estás a punto de suspender la cuenta de{" "}
                <strong className="text-foreground">{coachName}</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                El entrenador no podrá iniciar sesión en su panel y sus alumnos
                verán una pantalla de servicio temporalmente pausado al ingresar
                a su portal. Podrás reactivar su cuenta en cualquier momento.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              onClick={(e) => {
                e.preventDefault()
                handleToggle(false)
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading && <Loader2 className="size-4 animate-spin mr-2" />}
              Confirmar Suspensión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
