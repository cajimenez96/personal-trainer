import { Prisma } from "@/app/generated/prisma/client"
import { db } from "@/lib/db"
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

  muscleGroups(trainerId?: string | null) {
    return this.exerciseRepo.listMuscleGroups(trainerId)
  }

  async create(data: CreateExerciseData) {
    const existing = await this.exerciseRepo.findByName(data.name, data.trainerId)
    if (existing && existing.trainerId === (data.trainerId || null)) {
      throw new ExerciseNameTakenError(data.name)
    }

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

  // Idempotent find-or-create — used by the routine CSV importer
  async findOrCreate(data: CreateExerciseData) {
    const existing = await this.exerciseRepo.findByName(data.name, data.trainerId)
    if (existing) return existing
    return this.create(data)
  }

  async update(
    id: string,
    data: UpdateExerciseData,
    currentTrainerId?: string | null,
  ) {
    const current = await this.exerciseRepo.findById(id)
    if (!current) {
      throw new Error("Ejercicio no encontrado")
    }

    // COPY-ON-WRITE: Si un coach edita un ejercicio global (maestro del SuperAdmin),
    // creamos una copia privada para el coach sin tocar el ejercicio maestro
    if (current.trainerId === null && currentTrainerId) {
      const cloned = await this.exerciseRepo.create({
        trainerId: currentTrainerId,
        name: data.name,
        primaryMuscle: data.primaryMuscle,
        secondaryMuscle: data.secondaryMuscle,
        videoUrl: data.videoUrl,
      })

      // Actualizar los bloques de rutina del coach para que apunten a su copia
      await db.exerciseBlock.updateMany({
        where: {
          exerciseId: id,
          trainingDay: {
            template: {
              trainerId: currentTrainerId,
            },
          },
        },
        data: {
          exerciseId: cloned.id,
        },
      })

      return cloned
    }

    // Edición normal en su propio ejercicio
    const existing = await this.exerciseRepo.findByName(data.name, current.trainerId)
    if (existing && existing.id !== id && existing.trainerId === current.trainerId) {
      throw new ExerciseNameTakenError(data.name)
    }

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

  async delete(id: string, currentTrainerId?: string | null) {
    const current = await this.exerciseRepo.findById(id)
    if (!current) return

    // Un coach no puede borrar ejercicios globales del catálogo maestro
    if (current.trainerId === null && currentTrainerId) {
      throw new Error("No podés eliminar un ejercicio del catálogo maestro de la plataforma.")
    }

    const referencedCount = await this.exerciseRepo.countBlocksUsing(id)
    if (referencedCount > 0) throw new ExerciseInUseError()
    await this.exerciseRepo.delete(id)
  }
}

export const exerciseService = new ExerciseService(new PrismaExerciseRepository())
