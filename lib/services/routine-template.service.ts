import type {
  CreateRoutineTemplateData,
  IRoutineTemplateRepository,
} from "@/lib/repositories/interfaces"
import { PrismaRoutineTemplateRepository } from "@/lib/repositories/routine-template.repository"

export { TemplateBlockInUseError } from "@/lib/repositories/routine-template.repository"

export class RoutineTemplateInUseError extends Error {
  constructor() {
    super(
      "Esta plantilla tiene alumnos con una rutina asignada (activa o histórica) y no se puede eliminar.",
    )
    this.name = "RoutineTemplateInUseError"
  }
}

export class RoutineTemplateService {
  constructor(private readonly templateRepo: IRoutineTemplateRepository) {}

  create(data: CreateRoutineTemplateData) {
    return this.templateRepo.create(data)
  }

  list(trainerId?: string) {
    return this.templateRepo.findMany(trainerId)
  }

  getById(id: string) {
    return this.templateRepo.findById(id)
  }

  update(id: string, data: CreateRoutineTemplateData) {
    return this.templateRepo.update(id, data)
  }

  duplicate(id: string) {
    return this.templateRepo.duplicate(id)
  }

  countAssignments(id: string) {
    return this.templateRepo.countAssignments(id)
  }

  async delete(id: string) {
    const referencedCount = await this.templateRepo.countAssignments(id)
    if (referencedCount > 0) throw new RoutineTemplateInUseError()
    await this.templateRepo.delete(id)
  }
}

export const routineTemplateService = new RoutineTemplateService(
  new PrismaRoutineTemplateRepository(),
)
