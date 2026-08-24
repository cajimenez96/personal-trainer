import Link from "next/link"
import { Suspense } from "react"
import { PlayCircle } from "lucide-react"
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
import { FlashToast } from "@/components/admin/flash-toast"
import { ClickableTableRow } from "@/components/admin/clickable-table-row"
import { ActionsCell } from "@/components/admin/actions-cell"
import { ExerciseRowActions } from "@/components/admin/exercise-row-actions"
import { VideoDialog } from "@/components/shared/video-dialog"
import { exerciseService } from "@/lib/services/exercise.service"
import { exerciseListQuerySchema } from "@/lib/validators/exercise"

export default async function EjerciciosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const raw = await searchParams
  const parsed = exerciseListQuerySchema.safeParse(raw)
  const query = parsed.success ? parsed.data : {}

  const [exercises, muscleGroups] = await Promise.all([
    exerciseService.list(query),
    exerciseService.muscleGroups(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <Suspense>
        <FlashToast
          messages={{
            created: "Ejercicio creado correctamente.",
            updated: "Ejercicio actualizado correctamente.",
            deleted: "Ejercicio eliminado.",
          }}
        />
      </Suspense>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Ejercicios</h1>
        <Button render={<Link href="/ejercicios/nuevo" />}>Nuevo ejercicio</Button>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex w-full flex-col gap-1 sm:w-56">
          <label htmlFor="search" className="text-sm text-muted-foreground">
            Buscar
          </label>
          <Input
            id="search"
            name="search"
            placeholder="Nombre del ejercicio"
            defaultValue={query.search ?? ""}
            className="w-full"
          />
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-48">
          <span className="text-sm text-muted-foreground">Grupo muscular</span>
          <select
            name="muscleGroup"
            defaultValue={query.muscleGroup ?? ""}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Todos</option>
            {muscleGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Músculo primario</TableHead>
              <TableHead>Músculo secundario</TableHead>
              <TableHead>Video</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercises.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No se encontraron ejercicios.
                </TableCell>
              </TableRow>
            )}
            {exercises.map((exercise) => (
              <ClickableTableRow key={exercise.id} href={`/ejercicios/${exercise.id}`}>
                <TableCell>
                  <Link href={`/ejercicios/${exercise.id}`} className="hover:underline">
                    {exercise.name}
                  </Link>
                </TableCell>
                <TableCell>{exercise.primaryMuscle}</TableCell>
                <TableCell>{exercise.secondaryMuscle ?? "—"}</TableCell>
                <ActionsCell>
                  {exercise.videoUrl ? (
                    <VideoDialog videoUrl={exercise.videoUrl} className="inline-flex">
                      <Badge variant="secondary" className="gap-1">
                        <PlayCircle className="size-3.5" />
                        Ver video
                      </Badge>
                    </VideoDialog>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </ActionsCell>
                <ActionsCell>
                  <ExerciseRowActions exerciseId={exercise.id} exerciseName={exercise.name} />
                </ActionsCell>
              </ClickableTableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
