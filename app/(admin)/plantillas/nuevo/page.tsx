import { TemplateBuilder } from "@/components/admin/template-builder"
import { requireCoachAuth } from "@/lib/auth"
import { exerciseService } from "@/lib/services/exercise.service"

// Exercise catalog is DB-backed and must be fresh on every visit.
export const dynamic = "force-dynamic"

export default async function NuevaPlantillaPage() {
  const user = await requireCoachAuth()
  const exercises = await exerciseService.list({ trainerId: user.id })

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-semibold">Nueva plantilla</h1>
      <TemplateBuilder
        exercises={exercises.map((e) => ({
          id: e.id,
          name: e.name,
          primaryMuscle: e.primaryMuscle,
        }))}
      />
    </div>
  )
}
