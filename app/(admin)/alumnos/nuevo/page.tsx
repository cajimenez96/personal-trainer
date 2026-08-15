import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StudentForm } from "@/components/admin/student-form"
import { createStudentAction } from "@/lib/actions/student.actions"

export default function NuevoAlumnoPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo alumno</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentForm mode="create" action={createStudentAction} />
        </CardContent>
      </Card>
    </div>
  )
}
