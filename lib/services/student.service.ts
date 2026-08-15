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

  listAllActive(filters: StudentFilters) {
    return this.studentRepo.findAllActive(filters)
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
