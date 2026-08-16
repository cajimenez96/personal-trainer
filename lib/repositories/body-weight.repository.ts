import { db } from "@/lib/db"
import type {
  BodyWeightEntry,
  IBodyWeightRepository,
  LogBodyWeightData,
} from "@/lib/repositories/interfaces"

export class PrismaBodyWeightRepository implements IBodyWeightRepository {
  async upsert({ studentId, loggedDate, weightKg }: LogBodyWeightData) {
    await db.bodyWeightLog.upsert({
      where: { unique_body_weight_per_day: { studentId, loggedDate } },
      create: { studentId, loggedDate, weightKg },
      update: { weightKg },
    })
  }

  async findByStudent(studentId: string): Promise<BodyWeightEntry[]> {
    const rows = await db.bodyWeightLog.findMany({
      where: { studentId },
      orderBy: { loggedDate: "desc" },
    })
    return rows.map((row) => ({
      id: row.id,
      loggedDate: row.loggedDate,
      weightKg: row.weightKg.toNumber(),
    }))
  }

  async findForDay(studentId: string, loggedDate: Date): Promise<BodyWeightEntry | null> {
    const row = await db.bodyWeightLog.findUnique({
      where: { unique_body_weight_per_day: { studentId, loggedDate } },
    })
    return row ? { id: row.id, loggedDate: row.loggedDate, weightKg: row.weightKg.toNumber() } : null
  }
}
