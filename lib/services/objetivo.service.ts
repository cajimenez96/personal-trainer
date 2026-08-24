import { Prisma } from "@/app/generated/prisma/client"
import type { ILabelOptionRepository } from "@/lib/repositories/interfaces"
import { PrismaObjetivoRepository } from "@/lib/repositories/objetivo.repository"

export class ObjetivoLabelTakenError extends Error {
  constructor(public readonly label: string) {
    super(`Ya existe un objetivo "${label}"`)
    this.name = "ObjetivoLabelTakenError"
  }
}

export class ObjetivoInUseError extends Error {
  constructor() {
    super("Este objetivo está asignado a uno o más alumnos y no se puede eliminar.")
    this.name = "ObjetivoInUseError"
  }
}

const PRISMA_UNIQUE_CONSTRAINT = "P2002"

export class ObjetivoService {
  constructor(private readonly repo: ILabelOptionRepository) {}

  list() {
    return this.repo.findMany()
  }

  async create(label: string) {
    try {
      return await this.repo.create({ label })
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PRISMA_UNIQUE_CONSTRAINT
      ) {
        throw new ObjetivoLabelTakenError(label)
      }
      throw err
    }
  }

  async rename(id: string, label: string) {
    try {
      return await this.repo.rename(id, label)
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PRISMA_UNIQUE_CONSTRAINT
      ) {
        throw new ObjetivoLabelTakenError(label)
      }
      throw err
    }
  }

  async delete(id: string) {
    const inUse = await this.repo.countStudentsUsing(id)
    if (inUse > 0) throw new ObjetivoInUseError()
    await this.repo.delete(id)
  }
}

export const objetivoService = new ObjetivoService(new PrismaObjetivoRepository())
