import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExerciseForm } from "@/components/admin/exercise-form"
import { DeleteExerciseButton } from "@/components/admin/delete-exercise-button"
import { updateExerciseAction } from "@/lib/actions/exercise.actions"
import { exerciseService } from "@/lib/services/exercise.service"

export default async function EjercicioDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ deleteError?: string }>
}) {
  const { id } = await params
  const { deleteError } = await searchParams
  const exercise = await exerciseService.getById(id)

  if (!exercise) notFound()

  const defaultValues = {
    name: exercise.name,
    primaryMuscle: exercise.primaryMuscle,
    secondaryMuscle: exercise.secondaryMuscle ?? "",
    videoUrl: exercise.videoUrl ?? "",
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>{exercise.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {deleteError === "in-use" && (
            <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Este ejercicio está referenciado en una o más plantillas y no se puede
              eliminar.
            </p>
          )}

          <ExerciseForm
            mode="edit"
            action={updateExerciseAction.bind(null, exercise.id)}
            defaultValues={defaultValues}
          />

          <div className="mt-8 flex justify-end border-t pt-6">
            <DeleteExerciseButton exerciseId={exercise.id} exerciseName={exercise.name} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
