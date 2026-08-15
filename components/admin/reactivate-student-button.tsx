"use client"

import { Button } from "@/components/ui/button"
import { reactivateStudentAction } from "@/lib/actions/student.actions"

export function ReactivateStudentButton({ studentId }: { studentId: string }) {
  const action = reactivateStudentAction.bind(null, studentId)

  return (
    <form action={action}>
      <Button type="submit" variant="secondary">
        Reactivar alumno
      </Button>
    </form>
  )
}
