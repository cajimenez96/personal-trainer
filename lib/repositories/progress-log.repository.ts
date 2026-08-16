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
    noteType,
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
        noteType: noteType ?? null,
      },
      update: {
        ...(completed !== undefined && { completed }),
        ...(weightKg !== undefined && { weightKg }),
        ...(studentNotes !== undefined && { studentNotes }),
        ...(noteType !== undefined && { noteType }),
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
      noteType: row.noteType,
    }))
  }

  async findByStudent(
    studentId: string,
    { from, to, noteType }: ProgressHistoryFilters,
  ): Promise<ProgressHistoryEntry[]> {
    const rows = await db.progressLog.findMany({
      where: {
        studentId,
        ...(noteType && { noteType }),
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
      noteType: row.noteType,
    }))
  }
}
