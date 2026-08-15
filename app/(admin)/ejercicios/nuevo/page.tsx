import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExerciseForm } from "@/components/admin/exercise-form"
import { createExerciseAction } from "@/lib/actions/exercise.actions"

export default function NuevoEjercicioPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo ejercicio</CardTitle>
        </CardHeader>
        <CardContent>
          <ExerciseForm mode="create" action={createExerciseAction} />
        </CardContent>
      </Card>
    </div>
  )
}
