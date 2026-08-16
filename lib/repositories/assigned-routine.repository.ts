import { db } from "@/lib/db"
import type {
  AdherenceStat,
  AssignedRoutineRaw,
  AssignRoutineData,
  IAssignedRoutineRepository,
} from "@/lib/repositories/interfaces"

const DAY_MS = 24 * 60 * 60 * 1000

function addWeeks(date: Date, weeks: number) {
  return new Date(date.getTime() + weeks * 7 * DAY_MS)
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
              repsScheme: o.repsScheme ?? null,
              weightKg: o.weightKg ?? null,
              intensity: o.intensity ?? null,
              tempo: o.tempo ?? null,
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

  async findByIdWithDetails(id: string): Promise<AssignedRoutineRaw | null> {
    const raw = await db.assignedRoutine.findUnique({
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
    if (!raw) return null

    return {
      ...raw,
      template: {
        ...raw.template,
        trainingDays: raw.template.trainingDays.map((day) => ({
          ...day,
          exerciseBlocks: day.exerciseBlocks.map((block) => ({
            ...block,
            weightKg: block.weightKg ? block.weightKg.toNumber() : null,
          })),
        })),
      },
      overrides: raw.overrides.map((o) => ({
        ...o,
        weightKg: o.weightKg ? o.weightKg.toNumber() : null,
      })),
    }
  }

  countActive() {
    return db.assignedRoutine.count({ where: { status: "active" } })
  }

  // Aproximación por volumen, no por calendario: no sabemos qué día de la
  // semana corresponde a qué día de la plantilla, así que "esperadas" es
  // (días de la plantilla) × (semanas transcurridas desde la asignación).
  async findAdherenceStats(): Promise<AdherenceStat[]> {
    const activeRoutines = await db.assignedRoutine.findMany({
      where: { status: "active", student: { isActive: true } },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        template: { select: { trainingDays: { select: { id: true } } } },
      },
    })

    const now = Date.now()

    return Promise.all(
      activeRoutines.map(async (routine) => {
        const daysPerWeek = routine.template.trainingDays.length
        const weeksElapsed = Math.max(
          1,
          Math.ceil((now - routine.assignedAt.getTime()) / (7 * DAY_MS)),
        )
        const expectedSessions = daysPerWeek * weeksElapsed

        const distinctDates = await db.progressLog.findMany({
          where: { studentId: routine.studentId, loggedDate: { gte: routine.assignedAt } },
          distinct: ["loggedDate"],
          select: { loggedDate: true },
          orderBy: { loggedDate: "desc" },
        })

        const lastLoggedDate = distinctDates[0]?.loggedDate ?? null

        return {
          studentId: routine.studentId,
          studentName: `${routine.student.firstName} ${routine.student.lastName}`,
          completedSessions: distinctDates.length,
          expectedSessions,
          daysSinceLastLog: lastLoggedDate
            ? Math.floor((now - lastLoggedDate.getTime()) / DAY_MS)
            : null,
        }
      }),
    )
  }
}
