import { db } from "@/lib/db"
import { getDefaultTrainerId } from "@/lib/tenant"
import type { Prisma } from "@/app/generated/prisma/client"
import type {
  CreateStudentData,
  IStudentRepository,
  StudentFilters,
  StudentListParams,
  StudentListResult,
  UpdateStudentData,
} from "@/lib/repositories/interfaces"

export class PrismaStudentRepository implements IStudentRepository {
  async findMany({
    trainerId,
    search,
    objetivoId,
    nivel,
    modalidadId,
    planId,
    isActive,
    cursor,
    limit,
  }: StudentListParams): Promise<StudentListResult> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    let studentIdsForPlan: string[] | null = null
    if (planId) {
      const students = await db.student.findMany({
        where: {
          trainerId: effectiveTrainerId,
          subscriptions: { some: {} },
        },
        select: {
          id: true,
          subscriptions: {
            orderBy: { startDate: "desc" },
            take: 1,
            select: {
              planId: true,
            },
          },
        },
      })
      studentIdsForPlan = students
        .filter((s) => s.subscriptions[0]?.planId === planId)
        .map((s) => s.id)
    }

    const where: Prisma.StudentWhereInput = {
      trainerId: effectiveTrainerId,
      isActive,
      objetivoId,
      nivel,
      modalidadId,
      ...(studentIdsForPlan !== null && {
        id: { in: studentIdsForPlan },
      }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { dni: { contains: search } },
        ],
      }),
    }

    const items = await db.student.findMany({
      where,
      include: {
        objetivoRef: true,
        modalidadRef: true,
        subscriptions: {
          take: 1,
          orderBy: { startDate: "desc" },
          select: {
            id: true,
            planId: true,
            plan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    })

    const hasMore = items.length > limit
    const page = hasMore ? items.slice(0, limit) : items

    return {
      items: page,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    }
  }

  findById(id: string) {
    return db.student.findUnique({ where: { id } })
  }

  async findByDni(dni: string, trainerId?: string) {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    return db.student.findUnique({
      where: {
        unique_student_per_trainer: {
          trainerId: effectiveTrainerId,
          dni,
        },
      },
    })
  }

  async create(data: CreateStudentData) {
    const effectiveTrainerId = data.trainerId ?? (await getDefaultTrainerId())
    return db.student.create({
      data: {
        ...data,
        trainerId: effectiveTrainerId,
      },
    })
  }

  update(id: string, data: UpdateStudentData) {
    return db.student.update({ where: { id }, data })
  }

  deactivate(id: string) {
    return db.student.update({ where: { id }, data: { isActive: false } })
  }

  reactivate(id: string) {
    return db.student.update({ where: { id }, data: { isActive: true } })
  }

  async findAllActive({ trainerId, objetivoId, nivel, modalidadId, planId, paymentExpired }: StudentFilters) {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    let studentIdsForPlan: string[] | null = null
    if (planId) {
      const students = await db.student.findMany({
        where: {
          trainerId: effectiveTrainerId,
          isActive: true,
          subscriptions: { some: {} },
        },
        select: {
          id: true,
          subscriptions: {
            orderBy: { startDate: "desc" },
            take: 1,
            select: {
              planId: true,
            },
          },
        },
      })
      studentIdsForPlan = students
        .filter((s) => s.subscriptions[0]?.planId === planId)
        .map((s) => s.id)
    }

    return db.student.findMany({
      where: {
        trainerId: effectiveTrainerId,
        isActive: true,
        objetivoId,
        nivel,
        modalidadId,
        ...(studentIdsForPlan !== null && { id: { in: studentIdsForPlan } }),
        ...(paymentExpired && { paymentExpiresAt: { not: null, lt: new Date() } }),
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    })
  }

  async countActive(trainerId?: string) {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    return db.student.count({ where: { trainerId: effectiveTrainerId, isActive: true } })
  }

  async countExpiringSoon(before: Date, trainerId?: string) {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    return db.student.count({
      where: { trainerId: effectiveTrainerId, isActive: true, paymentExpiresAt: { not: null, lte: before } },
    })
  }
}
