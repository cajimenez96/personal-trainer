"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { deleteGenericProfileAction } from "@/lib/actions/generic-profile.actions"

interface DeleteGenericProfileDialogProps {
  profile: {
    id: string
    name: string
  }
}

export function DeleteGenericProfileDialog({ profile }: DeleteGenericProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await deleteGenericProfileAction({ id: profile.id })
      if (res.ok) {
        toast.success(`Alumno genérico "${profile.name}" eliminado`)
        setOpen(false)
      } else {
        toast.error(res.error || "No se pudo eliminar el alumno genérico.")
      }
    } catch {
      toast.error("Ocurrió un error inesperado.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
          >
            <Trash2 className="size-3.5" />
            Eliminar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Eliminar alumno genérico?</DialogTitle>
          <DialogDescription>
            Estás a punto de eliminar el acceso para <strong>{profile.name}</strong>. Las personas que tengan esta clave ya no podrán ingresar a la rutina.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Confirmar Eliminación"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
