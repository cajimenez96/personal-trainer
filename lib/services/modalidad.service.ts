import { Prisma } from "@/app/generated/prisma/client"
import type { ILabelOptionRepository } from "@/lib/repositories/interfaces"
import { PrismaModalidadRepository } from "@/lib/repositories/modalidad.repository"

export class ModalidadLabelTakenError extends Error {
  constructor(public readonly label: string) {
    super(`Ya existe una modalidad "${label}"`)
    this.name = "ModalidadLabelTakenError"
  }
}

export class ModalidadInUseError extends Error {
  constructor() {
    super("Esta modalidad está asignada a uno o más alumnos y no se puede eliminar.")
    this.name = "ModalidadInUseError"
  }
}

const PRISMA_UNIQUE_CONSTRAINT = "P2002"

export class ModalidadService {
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
        throw new ModalidadLabelTakenError(label)
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
        throw new ModalidadLabelTakenError(label)
      }
      throw err
    }
  }

  async delete(id: string) {
    const inUse = await this.repo.countStudentsUsing(id)
    if (inUse > 0) throw new ModalidadInUseError()
    await this.repo.delete(id)
  }
}

export const modalidadService = new ModalidadService(new PrismaModalidadRepository())
