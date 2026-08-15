import { db } from "@/lib/db"
import type {
  AssignRoutineData,
  IAssignedRoutineRepository,
} from "@/lib/repositories/interfaces"

function addWeeks(date: Date, weeks: number) {
  return new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)
}

export class PrismaAssignedRoutineRepository implements IAssignedRoutineRepository {
  async assign({ studentId, templateId, overrides }: AssignRoutineData) {
    return db.$transaction(async (tx) => {
      // RN-04: at most one active routine per student — demote the current one first.
      await tx.assignedRoutine.updateMany({
        where: { studentId, status: "active" },
        data: { status: "historic" },
      })

      const template = await tx.routineTemplate.findUniqueOrThrow({
        where: { id: templateId },
        select: { durationWeeks: true },
      })

      return tx.assignedRoutine.create({
        data: {
          studentId,
          templateId,
          status: "active",
          expiresAt: addWeeks(new Date(), template.durationWeeks),
          overrides: {
            create: overrides.map((o) => ({
              exerciseBlockId: o.exerciseBlockId,
              sets: o.sets ?? null,
              reps: o.reps ?? null,
              durationSecs: o.durationSecs ?? null,
              restSecs: o.restSecs ?? null,
              trainerNotes: o.trainerNotes ?? null,
            })),
          },
        },
      })
    })
  }

  findActiveByStudentId(studentId: string) {
    return db.assignedRoutine.findFirst({
      where: { studentId, status: "active" },
      include: { template: { select: { name: true } } },
    })
  }

  findHistoryByStudentId(studentId: string) {
    return db.assignedRoutine.findMany({
      where: { studentId },
      orderBy: { assignedAt: "desc" },
      include: { template: { select: { name: true } } },
    })
  }

  findByIdWithDetails(id: string) {
    return db.assignedRoutine.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            name: true,
            trainingDays: {
              orderBy: { dayOrder: "asc" },
              include: {
                exerciseBlocks: {
                  orderBy: { blockOrder: "asc" },
                  include: { exercise: { select: { name: true, videoUrl: true } } },
                },
              },
            },
          },
        },
        overrides: true,
      },
    })
  }
}
