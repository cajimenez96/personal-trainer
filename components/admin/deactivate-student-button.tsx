"use client"

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
import { Button } from "@/components/ui/button"
import { deactivateStudentAction } from "@/lib/actions/student.actions"

export function DeactivateStudentButton({
  studentId,
  studentName,
}: {
  studentId: string
  studentName: string
}) {
  const action = deactivateStudentAction.bind(null, studentId)

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Desactivar alumno
      </AlertDialogTrigger>
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
          <form action={action} className="w-full">
            <AlertDialogAction type="submit" variant="destructive" className="w-full">
              Desactivar
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
