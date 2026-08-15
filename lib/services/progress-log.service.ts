import type {
  IProgressLogRepository,
  ProgressHistoryFilters,
  UpsertProgressLogData,
} from "@/lib/repositories/interfaces"
import { PrismaProgressLogRepository } from "@/lib/repositories/progress-log.repository"

// A DATE column has no timezone — pin to UTC midnight so every call the same
// calendar day resolves to the exact same value the UNIQUE constraint keys on.
export function todayUTC() {
  return new Date(new Date().toISOString().slice(0, 10))
}

export class ProgressLogService {
  constructor(private readonly progressLogRepo: IProgressLogRepository) {}

  upsert(data: UpsertProgressLogData) {
    return this.progressLogRepo.upsert(data)
  }

  getForToday(studentId: string) {
    return this.progressLogRepo.findForDay(studentId, todayUTC())
  }

  getHistory(studentId: string, filters: ProgressHistoryFilters) {
    return this.progressLogRepo.findByStudent(studentId, filters)
  }
}

export const progressLogService = new ProgressLogService(new PrismaProgressLogRepository())
