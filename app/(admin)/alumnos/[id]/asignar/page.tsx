import { notFound } from "next/navigation"
import { TemplatePicker } from "@/components/admin/template-picker"
import { AssignmentForm } from "@/components/admin/assignment-form"
import { requireCoachAuth } from "@/lib/auth"
import { studentService } from "@/lib/services/student.service"
import { routineTemplateService } from "@/lib/services/routine-template.service"
import { exerciseService } from "@/lib/services/exercise.service"

// DB-backed: student, template catalog, and exercise catalog must be fresh.
export const dynamic = "force-dynamic"

export default async function AsignarRutinaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ template?: string }>
}) {
  const user = await requireCoachAuth()
  const { id } = await params
  const { template: templateId } = await searchParams

  const student = await studentService.getById(id)
  if (!student || student.trainerId !== user.id) notFound()

  if (!templateId) {
    const templates = await routineTemplateService.list(user.id)

    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">Asignar rutina a {student.firstName} {student.lastName}</h1>
        <p className="mb-6 text-muted-foreground">Elegí una plantilla del catálogo.</p>

        <TemplatePicker templates={templates} hrefForTemplate={(templateId) => `/alumnos/${id}/asignar?template=${templateId}`} />
      </div>
    )
  }

  const [template, exercises] = await Promise.all([
    routineTemplateService.getById(templateId),
    exerciseService.list({ trainerId: user.id }),
  ])

  if (!template || template.trainerId !== user.id) notFound()

  const exerciseNames = Object.fromEntries(exercises.map((e) => [e.id, e.name]))

  return (
    <div className="mx-auto max-w-4xl">
      <AssignmentForm
        studentId={student.id}
        studentName={`${student.firstName} ${student.lastName}`}
        template={template}
        exerciseNames={exerciseNames}
      />
    </div>
  )
}
