import { db } from "@/lib/db"
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
    search,
    objetivoId,
    nivel,
    modalidadId,
    planId,
    isActive,
    cursor,
    limit,
  }: StudentListParams): Promise<StudentListResult> {
    let studentIdsForPlan: string[] | null = null
    if (planId) {
      const students = await db.student.findMany({
        where: {
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

  findByDni(dni: string) {
    return db.student.findUnique({ where: { dni } })
  }

  create(data: CreateStudentData) {
    return db.student.create({ data })
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

  async findAllActive({ objetivoId, nivel, modalidadId, planId, paymentExpired }: StudentFilters) {
    let studentIdsForPlan: string[] | null = null
    if (planId) {
      const students = await db.student.findMany({
        where: {
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

  countActive() {
    return db.student.count({ where: { isActive: true } })
  }

  countExpiringSoon(before: Date) {
    return db.student.count({
      where: { isActive: true, paymentExpiresAt: { not: null, lte: before } },
    })
  }
}
