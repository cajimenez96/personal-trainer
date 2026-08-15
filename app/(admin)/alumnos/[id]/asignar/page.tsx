import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssignmentForm } from "@/components/admin/assignment-form"
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
  const { id } = await params
  const { template: templateId } = await searchParams

  const student = await studentService.getById(id)
  if (!student) notFound()

  if (!templateId) {
    const templates = await routineTemplateService.list()

    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">Asignar rutina a {student.firstName} {student.lastName}</h1>
        <p className="mb-6 text-muted-foreground">Elegí una plantilla del catálogo.</p>

        {templates.length === 0 && (
          <p className="text-muted-foreground">No hay plantillas creadas todavía.</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Link key={t.id} href={`/alumnos/${id}/asignar?template=${t.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {t.name}
                    <Badge variant="secondary">{t.durationWeeks} sem.</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {t.trainingDays.length} día(s) ·{" "}
                    {t.trainingDays.reduce((sum, d) => sum + d.exerciseBlocks.length, 0)}{" "}
                    ejercicio(s)
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  const [template, exercises] = await Promise.all([
    routineTemplateService.getById(templateId),
    exerciseService.list({}),
  ])

  if (!template) notFound()

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
