import type {
  CreateRoutineTemplateData,
  IRoutineTemplateRepository,
} from "@/lib/repositories/interfaces"
import { PrismaRoutineTemplateRepository } from "@/lib/repositories/routine-template.repository"

export class RoutineTemplateService {
  constructor(private readonly templateRepo: IRoutineTemplateRepository) {}

  create(data: CreateRoutineTemplateData) {
    return this.templateRepo.create(data)
  }

  list() {
    return this.templateRepo.findMany()
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
}

export const routineTemplateService = new RoutineTemplateService(
  new PrismaRoutineTemplateRepository(),
)
