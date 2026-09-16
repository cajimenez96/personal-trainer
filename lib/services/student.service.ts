import { Prisma } from "@/app/generated/prisma/client"
import { db } from "@/lib/db"
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

const PRISMA_UNIQUE_CONSTRAINT = "P2002"

export class StudentService {
  constructor(private readonly studentRepo: IStudentRepository) {}

  list(params: StudentListParams) {
    return this.studentRepo.findMany(params)
  }

  getById(id: string) {
    return this.studentRepo.findById(id)
  }

  getByDni(dni: string) {
    return this.studentRepo.findByDni(dni)
  }

  update(id: string, data: UpdateStudentData) {
    return this.studentRepo.update(id, data)
  }

  deactivate(id: string) {
    return this.studentRepo.deactivate(id)
  }

  reactivate(id: string) {
    return this.studentRepo.reactivate(id)
  }

  listAllActive(filters: StudentFilters) {
    return this.studentRepo.findAllActive(filters)
  }

  countActive() {
    return this.studentRepo.countActive()
  }

  // "Expiring soon" includes already-overdue students — both need the trainer's attention.
  countExpiringSoon(withinDays: number) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + withinDays)
    return this.studentRepo.countExpiringSoon(cutoff)
  }

  async getExpiringStudents(withinDays = 14): Promise<ExpiringStudentDTO[]> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + withinDays)
    cutoff.setHours(23, 59, 59, 999)

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const students = await db.student.findMany({
      where: {
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
    const existing = await this.studentRepo.findByDni(data.dni)
    if (existing) {
      throw new DniAlreadyExistsError(data.dni, {
        id: existing.id,
        firstName: existing.firstName,
        lastName: existing.lastName,
        isActive: existing.isActive,
      })
    }

    try {
      return await this.studentRepo.create(data)
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PRISMA_UNIQUE_CONSTRAINT
      ) {
        const found = await this.studentRepo.findByDni(data.dni)
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
