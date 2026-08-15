import { db } from "@/lib/db"
import type {
  IProgressLogRepository,
  ProgressHistoryEntry,
  ProgressHistoryFilters,
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

  async findByStudent(
    studentId: string,
    { from, to }: ProgressHistoryFilters,
  ): Promise<ProgressHistoryEntry[]> {
    const rows = await db.progressLog.findMany({
      where: {
        studentId,
        ...((from || to) && {
          loggedDate: {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
          },
        }),
      },
      include: { exerciseBlock: { include: { exercise: true } } },
      orderBy: [{ loggedDate: "desc" }, { createdAt: "desc" }],
    })

    return rows.map((row) => ({
      loggedDate: row.loggedDate,
      exerciseBlockId: row.exerciseBlockId,
      exerciseName: row.exerciseBlock.exercise.name,
      completed: row.completed,
      weightKg: row.weightKg ? row.weightKg.toNumber() : null,
      studentNotes: row.studentNotes,
    }))
  }
}
