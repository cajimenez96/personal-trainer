import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { TemplateBuilder, type TemplateInitialValues } from "@/components/admin/template-builder"
import { DuplicateTemplateButton } from "@/components/admin/duplicate-template-button"
import { FlashToast } from "@/components/admin/flash-toast"
import { exerciseService } from "@/lib/services/exercise.service"
import { routineTemplateService } from "@/lib/services/routine-template.service"

// DB-backed detail (template + exercise catalog) — must be fresh on every visit.
export const dynamic = "force-dynamic"

export default async function PlantillaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [template, exercises, assignmentCount] = await Promise.all([
    routineTemplateService.getById(id),
    exerciseService.list({}),
    routineTemplateService.countAssignments(id),
  ])

  if (!template) notFound()

  const initial: TemplateInitialValues = {
    name: template.name,
    description: template.description ?? "",
    durationWeeks: String(template.durationWeeks),
    days: template.trainingDays.map((day) => ({
      label: day.label,
      blocks: day.exerciseBlocks.map((block) => ({
        exerciseId: block.exerciseId,
        sets: String(block.sets),
        reps: block.reps ? String(block.reps) : "",
        durationSecs: block.durationSecs ? String(block.durationSecs) : "",
        restSecs: block.restSecs ? String(block.restSecs) : "",
        trainerNotes: block.trainerNotes ?? "",
      })),
    })),
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Suspense>
        <FlashToast messages={{ duplicated: "Plantilla duplicada correctamente." }} />
      </Suspense>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{template.name}</h1>
        <div className="flex gap-3">
          <Button
            variant="outline"
            render={<Link href={`/plantillas/${template.id}/asignar-masivo`} />}
          >
            Asignación masiva
          </Button>
          <DuplicateTemplateButton templateId={template.id} />
        </div>
      </div>

      {assignmentCount > 0 && (
        <p className="mb-6 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          Esta plantilla tiene {assignmentCount} alumno(s) con una rutina asignada desde
          acá. Los cambios no van a alterar esas rutinas ya asignadas ni a otros alumnos
          que compartan la plantilla.
        </p>
      )}

      <TemplateBuilder
        exercises={exercises.map((e) => ({
          id: e.id,
          name: e.name,
          primaryMuscle: e.primaryMuscle,
        }))}
        mode="edit"
        templateId={template.id}
        initial={initial}
      />
    </div>
  )
}
