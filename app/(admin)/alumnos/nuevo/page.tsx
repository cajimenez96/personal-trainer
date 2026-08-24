import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StudentForm } from "@/components/admin/student-form"
import { createStudentAction } from "@/lib/actions/student.actions"
import { objetivoService } from "@/lib/services/objetivo.service"
import { modalidadService } from "@/lib/services/modalidad.service"

export const dynamic = "force-dynamic"

export default async function NuevoAlumnoPage() {
  const [objetivos, modalidades] = await Promise.all([
    objetivoService.list(),
    modalidadService.list(),
  ])

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo alumno</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentForm
            mode="create"
            action={createStudentAction}
            objetivos={objetivos}
            modalidades={modalidades}
          />
        </CardContent>
      </Card>
    </div>
  )
}
