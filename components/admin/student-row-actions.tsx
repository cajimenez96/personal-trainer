"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
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
import { deactivateStudentAction, reactivateStudentAction } from "@/lib/actions/student.actions"

export function StudentRowActions({
  studentId,
  studentName,
  isActive,
}: {
  studentId: string
  studentName: string
  isActive: boolean
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deactivateAction = deactivateStudentAction.bind(null, studentId)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" aria-label="Acciones" />}
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem render={<Link href={`/alumnos/${studentId}`} />}>
            Editar
          </DropdownMenuItem>
          {isActive ? (
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
              Desactivar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => reactivateStudentAction(studentId)}>
              Reactivar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar a {studentName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Dejará de aparecer en el listado activo y no va a poder acceder al portal
              con su DNI. Su historial se conserva.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <form action={deactivateAction} className="w-full">
              <AlertDialogAction type="submit" variant="destructive" className="w-full">
                Desactivar
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
