import type { IBodyWeightRepository, LogBodyWeightData } from "@/lib/repositories/interfaces"
import { PrismaBodyWeightRepository } from "@/lib/repositories/body-weight.repository"
import { todayUTC } from "@/lib/services/progress-log.service"

export class BodyWeightService {
  constructor(private readonly repo: IBodyWeightRepository) {}

  log(data: LogBodyWeightData) {
    return this.repo.upsert(data)
  }

  history(studentId: string) {
    return this.repo.findByStudent(studentId)
  }

  getForToday(studentId: string) {
    return this.repo.findForDay(studentId, todayUTC())
  }
}

export const bodyWeightService = new BodyWeightService(new PrismaBodyWeightRepository())
