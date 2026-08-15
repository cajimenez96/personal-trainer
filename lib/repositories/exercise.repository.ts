import { db } from "@/lib/db"
import type { Prisma } from "@/app/generated/prisma/client"
import type {
  CreateExerciseData,
  ExerciseFilters,
  IExerciseRepository,
  UpdateExerciseData,
} from "@/lib/repositories/interfaces"

export class PrismaExerciseRepository implements IExerciseRepository {
  findMany({ search, muscleGroup }: ExerciseFilters) {
    const where: Prisma.ExerciseWhereInput = {
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(muscleGroup && {
        OR: [{ primaryMuscle: muscleGroup }, { secondaryMuscle: muscleGroup }],
      }),
    }

    return db.exercise.findMany({ where, orderBy: { name: "asc" } })
  }

  findById(id: string) {
    return db.exercise.findUnique({ where: { id } })
  }

  findByName(name: string) {
    return db.exercise.findUnique({ where: { name } })
  }

  async listMuscleGroups() {
    const rows = await db.exercise.findMany({
      select: { primaryMuscle: true },
      distinct: ["primaryMuscle"],
      orderBy: { primaryMuscle: "asc" },
    })
    return rows.map((r) => r.primaryMuscle)
  }

  create(data: CreateExerciseData) {
    return db.exercise.create({ data })
  }

  update(id: string, data: UpdateExerciseData) {
    return db.exercise.update({ where: { id }, data })
  }

  async delete(id: string) {
    await db.exercise.delete({ where: { id } })
  }

  countBlocksUsing(id: string) {
    return db.exerciseBlock.count({ where: { exerciseId: id } })
  }
}
