import { Prisma } from "@/app/generated/prisma/client"
import { db } from "@/lib/db"
import { getDefaultTrainerId } from "@/lib/tenant"
import { bodyWeightService } from "@/lib/services/body-weight.service"
import { todayUTC } from "@/lib/services/progress-log.service"
import type {
  CreateStudentData,
  ExpiringStudentDTO,
  IStudentRepository,
  StudentFilters,
  StudentListParams,
  UpdateStudentData,
} from "@/lib/repositories/interfaces"
import { PrismaStudentRepository } from "@/lib/repositories/student.repository"

export class DniAlreadyExistsError extends Error {
  constructor(
    public readonly dni: string,
    public readonly existingStudent?: {
      id: string
      firstName: string
      lastName: string
      isActive: boolean
    },
  ) {
    super(`Ya existe un alumno con DNI ${dni}`)
    this.name = "DniAlreadyExistsError"
  }
}

export const DEFAULT_MAX_STUDENTS = 10

export class StudentLimitReachedError extends Error {
  constructor(max = DEFAULT_MAX_STUDENTS) {
    super(
      `Límite de alumnos alcanzado: tu plan actual permite hasta ${max} alumnos activos. Contactá al administrador para ampliar tu cupo.`,
    )
    this.name = "StudentLimitReachedError"
  }
}

export type TrainerLimitsLookup = (
  trainerId: string,
) => Promise<{ maxStudents: number } | null>

const PRISMA_UNIQUE_CONSTRAINT = "P2002"

export class StudentService {
  constructor(
    private readonly studentRepo: IStudentRepository,
    private readonly limitsLookup?: TrainerLimitsLookup,
  ) {}

  private async getMaxStudents(trainerId?: string): Promise<number> {
    if (!trainerId) return DEFAULT_MAX_STUDENTS
    if (this.limitsLookup) {
      const res = await this.limitsLookup(trainerId)
      return res?.maxStudents ?? DEFAULT_MAX_STUDENTS
    }
    try {
      const trainer = await db.trainer.findUnique({
        where: { id: trainerId },
        select: { maxStudents: true },
      })
      return trainer?.maxStudents ?? DEFAULT_MAX_STUDENTS
    } catch {
      return DEFAULT_MAX_STUDENTS
    }
  }

  list(params: StudentListParams) {
    return this.studentRepo.findMany(params)
  }

  getById(id: string) {
    return this.studentRepo.findById(id)
  }

  getByDni(dni: string, trainerId?: string) {
    return this.studentRepo.findByDni(dni, trainerId)
  }

  update(id: string, data: UpdateStudentData) {
    return this.studentRepo.update(id, data)
  }

  deactivate(id: string) {
    return this.studentRepo.deactivate(id)
  }

  async reactivate(id: string) {
    const student = await this.studentRepo.findById(id)
    if (student && student.trainerId) {
      const maxStudents = await this.getMaxStudents(student.trainerId)
      const activeCount = await this.studentRepo.countActive(student.trainerId)
      if (activeCount >= maxStudents) {
        throw new StudentLimitReachedError(maxStudents)
      }
    }
    return this.studentRepo.reactivate(id)
  }

  listAllActive(filters: StudentFilters) {
    return this.studentRepo.findAllActive(filters)
  }

  countActive(trainerId?: string) {
    return this.studentRepo.countActive(trainerId)
  }

  // "Expiring soon" includes already-overdue students — both need the trainer's attention.
  async countExpiringSoon(withinDays: number, trainerId?: string) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + withinDays)
    return this.studentRepo.countExpiringSoon(cutoff, trainerId)
  }

  async getExpiringStudents(withinDays = 14, trainerId?: string): Promise<ExpiringStudentDTO[]> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + withinDays)
    cutoff.setHours(23, 59, 59, 999)

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const students = await db.student.findMany({
      where: {
        trainerId: effectiveTrainerId,
        isActive: true,
        paymentExpiresAt: {
          lte: cutoff,
        },
      },
      include: {
        subscriptions: {
          orderBy: { startDate: "desc" },
          take: 1,
          include: {
            plan: true,
          },
        },
        payments: {
          select: {
            amount: true,
          },
        },
      },
      orderBy: {
        paymentExpiresAt: "asc",
      },
    })

    const studentIds = students.map((s) => s.id)
    const allSubs = await db.studentSubscription.findMany({
      where: { studentId: { in: studentIds } },
      select: { studentId: true, priceSnapshot: true },
    })

    const totalChargesMap = new Map<string, number>()
    for (const sub of allSubs) {
      totalChargesMap.set(
        sub.studentId,
        (totalChargesMap.get(sub.studentId) ?? 0) + Number(sub.priceSnapshot),
      )
    }

    return students.map((s) => {
      const latestSub = s.subscriptions[0]
      const totalCharges = totalChargesMap.get(s.id) ?? 0
      const totalPaid = s.payments.reduce((acc, p) => acc + Number(p.amount), 0)
      const pendingBalance = totalCharges - totalPaid

      let daysRemaining: number | null = null
      let isOverdue = false

      if (s.paymentExpiresAt) {
        const exp = new Date(s.paymentExpiresAt)
        exp.setHours(0, 0, 0, 0)
        const diffMs = exp.getTime() - now.getTime()
        daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24))
        isOverdue = daysRemaining < 0
      }

      return {
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        dni: s.dni,
        phone: s.phone,
        paymentExpiresAt: s.paymentExpiresAt,
        daysRemaining,
        isOverdue,
        planName: latestSub?.plan.name ?? null,
        planPrice: latestSub ? Number(latestSub.priceSnapshot) : null,
        pendingBalance,
        accessOverride: s.accessOverride as "auto" | "allowed" | "blocked",
        isActive: s.isActive,
      }
    })
  }

  async create(data: CreateStudentData) {
    if (data.trainerId) {
      const maxStudents = await this.getMaxStudents(data.trainerId)
      const activeCount = await this.studentRepo.countActive(data.trainerId)
      if (activeCount >= maxStudents) {
        throw new StudentLimitReachedError(maxStudents)
      }
    }

    const existing = await this.studentRepo.findByDni(data.dni, data.trainerId)
    if (existing) {
      throw new DniAlreadyExistsError(data.dni, {
        id: existing.id,
        firstName: existing.firstName,
        lastName: existing.lastName,
        isActive: existing.isActive,
      })
    }

    try {
      const created = await this.studentRepo.create(data)
      if (data.initialWeightKg && data.initialWeightKg > 0) {
        await bodyWeightService.log({
          studentId: created.id,
          loggedDate: todayUTC(),
          weightKg: data.initialWeightKg,
        })
      }
      return created
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PRISMA_UNIQUE_CONSTRAINT
      ) {
        const found = await this.studentRepo.findByDni(data.dni, data.trainerId)
        throw new DniAlreadyExistsError(
          data.dni,
          found
            ? {
                id: found.id,
                firstName: found.firstName,
                lastName: found.lastName,
                isActive: found.isActive,
              }
            : undefined,
        )
      }
      throw err
    }
  }
}

export const studentService = new StudentService(new PrismaStudentRepository())

