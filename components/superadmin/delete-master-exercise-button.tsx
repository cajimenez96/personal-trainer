"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteMasterExerciseAction } from "@/lib/actions/exercise.actions"

interface DeleteMasterExerciseButtonProps {
  exerciseId: string
  exerciseName: string
}

export function DeleteMasterExerciseButton({
  exerciseId,
  exerciseName,
}: DeleteMasterExerciseButtonProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await deleteMasterExerciseAction(exerciseId)
      if (res.success) {
        toast.success(`Ejercicio "${exerciseName}" eliminado del catálogo maestro`)
        setOpen(false)
      } else {
        toast.error(res.error || "Error al eliminar ejercicio")
      }
    } catch {
      toast.error("Ocurrió un error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar ejercicio maestro?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de eliminar <strong>{exerciseName}</strong> del
            catálogo maestro. Solo podrá eliminarse si no está siendo utilizado en
            plantillas activas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            {loading && <Loader2 className="size-4 animate-spin mr-2" />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
