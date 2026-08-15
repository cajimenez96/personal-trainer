import { db } from "@/lib/db"
import type {
  IProgressLogRepository,
  ProgressLogEntry,
  UpsertProgressLogData,
} from "@/lib/repositories/interfaces"

export class PrismaProgressLogRepository implements IProgressLogRepository {
  async upsert({
    studentId,
    assignedRoutineId,
    exerciseBlockId,
    loggedDate,
    completed,
    weightKg,
    studentNotes,
  }: UpsertProgressLogData) {
    await db.progressLog.upsert({
      where: {
        unique_progress_per_day: { studentId, exerciseBlockId, loggedDate },
      },
      create: {
        studentId,
        assignedRoutineId,
        exerciseBlockId,
        loggedDate,
        completed: completed ?? false,
        weightKg: weightKg ?? null,
        studentNotes: studentNotes ?? null,
      },
      update: {
        ...(completed !== undefined && { completed }),
        ...(weightKg !== undefined && { weightKg }),
        ...(studentNotes !== undefined && { studentNotes }),
      },
    })
  }

  async findForDay(studentId: string, loggedDate: Date): Promise<ProgressLogEntry[]> {
    const rows = await db.progressLog.findMany({
      where: { studentId, loggedDate },
    })

    return rows.map((row) => ({
      exerciseBlockId: row.exerciseBlockId,
      completed: row.completed,
      weightKg: row.weightKg ? row.weightKg.toNumber() : null,
      studentNotes: row.studentNotes,
    }))
  }
}
