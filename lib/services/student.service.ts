import { Prisma } from "@/app/generated/prisma/client"
import type {
  CreateStudentData,
  IStudentRepository,
  StudentFilters,
  StudentListParams,
  UpdateStudentData,
} from "@/lib/repositories/interfaces"
import { PrismaStudentRepository } from "@/lib/repositories/student.repository"

export class DniAlreadyExistsError extends Error {
  constructor(public readonly dni: string) {
    super(`Ya existe un alumno con DNI ${dni}`)
    this.name = "DniAlreadyExistsError"
  }
}

const PRISMA_UNIQUE_CONSTRAINT = "P2002"

export class StudentService {
  constructor(private readonly studentRepo: IStudentRepository) {}

  list(params: StudentListParams) {
    return this.studentRepo.findMany(params)
  }

  getById(id: string) {
    return this.studentRepo.findById(id)
  }

  getByDni(dni: string) {
    return this.studentRepo.findByDni(dni)
  }

  update(id: string, data: UpdateStudentData) {
    return this.studentRepo.update(id, data)
  }

  deactivate(id: string) {
    return this.studentRepo.deactivate(id)
  }

  reactivate(id: string) {
    return this.studentRepo.reactivate(id)
  }

  listAllActive(filters: StudentFilters) {
    return this.studentRepo.findAllActive(filters)
  }

  countActive() {
    return this.studentRepo.countActive()
  }

  // "Expiring soon" includes already-overdue students — both need the trainer's attention.
  countExpiringSoon(withinDays: number) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + withinDays)
    return this.studentRepo.countExpiringSoon(cutoff)
  }

  async create(data: CreateStudentData) {
    const existing = await this.studentRepo.findByDni(data.dni)
    if (existing) throw new DniAlreadyExistsError(data.dni)

    try {
      return await this.studentRepo.create(data)
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PRISMA_UNIQUE_CONSTRAINT
      ) {
        throw new DniAlreadyExistsError(data.dni)
      }
      throw err
    }
  }
}

export const studentService = new StudentService(new PrismaStudentRepository())
