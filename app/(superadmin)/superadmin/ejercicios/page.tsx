import Link from "next/link"
import { PlayCircle, Dumbbell } from "lucide-react"
import { requireSuperAdminAuth } from "@/lib/auth"
import { exerciseService } from "@/lib/services/exercise.service"
import { exerciseListQuerySchema } from "@/lib/validators/exercise"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { VideoDialog } from "@/components/shared/video-dialog"
import { ExerciseDialog } from "@/components/superadmin/exercise-dialog"
import { DeleteMasterExerciseButton } from "@/components/superadmin/delete-master-exercise-button"

export const dynamic = "force-dynamic"

export default async function SuperAdminEjerciciosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  await requireSuperAdminAuth()

  const raw = await searchParams
  const parsed = exerciseListQuerySchema.safeParse(raw)
  const query = parsed.success ? parsed.data : {}

  const [exercises, muscleGroups] = await Promise.all([
    exerciseService.list({ ...query, globalOnly: true }),
    exerciseService.muscleGroups(null),
  ])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Dumbbell className="size-7 text-primary" />
            Catálogo Maestro de Ejercicios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Biblioteca global de ejercicios y videos disponible para todos los
            entrenadores de la plataforma.
          </p>
        </div>
        <ExerciseDialog mode="create" />
      </div>

      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">
                Ejercicios Globales ({exercises.length})
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Los profesores pueden usarlos como base o clonarlos a sus propias
                cuentas.
              </p>
            </div>

            {/* Filter Form */}
            <form className="flex flex-wrap items-center gap-3" method="get">
              <div className="w-full sm:w-56">
                <Input
                  id="search"
                  name="search"
                  placeholder="Buscar ejercicio..."
                  defaultValue={query.search ?? ""}
                  className="h-9 text-sm"
                />
              </div>

              <div className="w-full sm:w-48">
                <select
                  name="muscleGroup"
                  defaultValue={query.muscleGroup ?? ""}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Todos los músculos</option>
                  {muscleGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" variant="secondary" size="sm">
                Filtrar
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-3 px-4">Nombre del Ejercicio</TableHead>
                  <TableHead className="py-3 px-4">Músculo Primario</TableHead>
                  <TableHead className="py-3 px-4">Músculo Secundario</TableHead>
                  <TableHead className="py-3 px-4">Video</TableHead>
                  <TableHead className="py-3 px-4 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exercises.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No se encontraron ejercicios en el catálogo maestro.
                    </TableCell>
                  </TableRow>
                )}
                {exercises.map((exercise) => (
                  <TableRow key={exercise.id} className="hover:bg-muted/30">
                    <TableCell className="py-3 px-4 font-semibold text-foreground">
                      {exercise.name}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">
                        {exercise.primaryMuscle}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs text-muted-foreground">
                      {exercise.secondaryMuscle ?? "—"}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {exercise.videoUrl ? (
                        <VideoDialog
                          videoUrl={exercise.videoUrl}
                          className="inline-flex"
                        >
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <PlayCircle className="size-3.5" />
                            Ver Video
                          </Badge>
                        </VideoDialog>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ExerciseDialog mode="edit" exercise={exercise} />
                        <DeleteMasterExerciseButton
                          exerciseId={exercise.id}
                          exerciseName={exercise.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
