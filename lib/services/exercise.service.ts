import { Prisma } from "@/app/generated/prisma/client"
import type {
  CreateExerciseData,
  ExerciseFilters,
  IExerciseRepository,
  UpdateExerciseData,
} from "@/lib/repositories/interfaces"
import { PrismaExerciseRepository } from "@/lib/repositories/exercise.repository"

export class ExerciseNameTakenError extends Error {
  constructor(public readonly name: string) {
    super(`Ya existe un ejercicio llamado "${name}"`)
    this.name = "ExerciseNameTakenError"
  }
}

export class ExerciseInUseError extends Error {
  constructor() {
    super(
      "Este ejercicio está referenciado en una o más plantillas y no se puede eliminar.",
    )
    this.name = "ExerciseInUseError"
  }
}

const PRISMA_UNIQUE_CONSTRAINT = "P2002"

export class ExerciseService {
  constructor(private readonly exerciseRepo: IExerciseRepository) {}

  list(filters: ExerciseFilters) {
    return this.exerciseRepo.findMany(filters)
  }

  getById(id: string) {
    return this.exerciseRepo.findById(id)
  }

  muscleGroups() {
    return this.exerciseRepo.listMuscleGroups()
  }

  async create(data: CreateExerciseData) {
    const existing = await this.exerciseRepo.findByName(data.name)
    if (existing) throw new ExerciseNameTakenError(data.name)

    try {
      return await this.exerciseRepo.create(data)
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PRISMA_UNIQUE_CONSTRAINT
      ) {
        throw new ExerciseNameTakenError(data.name)
      }
      throw err
    }
  }

  async update(id: string, data: UpdateExerciseData) {
    const existing = await this.exerciseRepo.findByName(data.name)
    if (existing && existing.id !== id) throw new ExerciseNameTakenError(data.name)

    try {
      return await this.exerciseRepo.update(id, data)
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PRISMA_UNIQUE_CONSTRAINT
      ) {
        throw new ExerciseNameTakenError(data.name)
      }
      throw err
    }
  }

  async delete(id: string) {
    const referencedCount = await this.exerciseRepo.countBlocksUsing(id)
    if (referencedCount > 0) throw new ExerciseInUseError()
    await this.exerciseRepo.delete(id)
  }
}

export const exerciseService = new ExerciseService(new PrismaExerciseRepository())
