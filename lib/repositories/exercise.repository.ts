import { db } from "@/lib/db"
import type { Prisma } from "@/app/generated/prisma/client"
import type {
  CreateExerciseData,
  ExerciseFilters,
  IExerciseRepository,
  UpdateExerciseData,
} from "@/lib/repositories/interfaces"

export class PrismaExerciseRepository implements IExerciseRepository {
  async findMany({ search, muscleGroup, trainerId, globalOnly }: ExerciseFilters) {
    const andConditions: Prisma.ExerciseWhereInput[] = []

    if (globalOnly) {
      andConditions.push({ trainerId: null })
    } else if (trainerId) {
      andConditions.push({
        OR: [{ trainerId: null }, { trainerId }],
      })
    }

    if (search) {
      andConditions.push({ name: { contains: search, mode: "insensitive" } })
    }

    if (muscleGroup) {
      andConditions.push({
        OR: [{ primaryMuscle: muscleGroup }, { secondaryMuscle: muscleGroup }],
      })
    }

    const where: Prisma.ExerciseWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {}

    const exercises = await db.exercise.findMany({
      where,
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    })

    // Si un entrenador tiene su versión personalizada de un ejercicio con el mismo nombre,
    // priorizamos la del entrenador sobre la global
    if (trainerId) {
      const uniqueMap = new Map<string, (typeof exercises)[0]>()
      for (const ex of exercises) {
        const lowerName = ex.name.toLowerCase()
        const existing = uniqueMap.get(lowerName)
        if (!existing || (ex.trainerId === trainerId && existing.trainerId === null)) {
          uniqueMap.set(lowerName, ex)
        }
      }
      return Array.from(uniqueMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      )
    }

    return exercises
  }

  findById(id: string) {
    return db.exercise.findUnique({ where: { id } })
  }

  async findByName(name: string, trainerId?: string | null) {
    if (trainerId) {
      const coachExercise = await db.exercise.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          trainerId,
        },
      })
      if (coachExercise) return coachExercise

      return db.exercise.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          trainerId: null,
        },
      })
    }

    if (trainerId === null) {
      return db.exercise.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          trainerId: null,
        },
      })
    }

    return db.exercise.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    })
  }

  async listMuscleGroups(trainerId?: string | null) {
    const where: Prisma.ExerciseWhereInput =
      trainerId === null
        ? { trainerId: null }
        : trainerId
          ? { OR: [{ trainerId: null }, { trainerId }] }
          : {}

    const rows = await db.exercise.findMany({
      where,
      select: { primaryMuscle: true },
      distinct: ["primaryMuscle"],
      orderBy: { primaryMuscle: "asc" },
    })
    return rows.map((r) => r.primaryMuscle)
  }

  create(data: CreateExerciseData) {
    return db.exercise.create({
      data: {
        name: data.name,
        primaryMuscle: data.primaryMuscle,
        secondaryMuscle: data.secondaryMuscle || null,
        videoUrl: data.videoUrl || null,
        trainerId: data.trainerId || null,
      },
    })
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
