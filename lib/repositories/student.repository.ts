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
    isActive,
    cursor,
    limit,
  }: StudentListParams): Promise<StudentListResult> {
    const where: Prisma.StudentWhereInput = {
      isActive,
      objetivoId,
      nivel,
      modalidadId,
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
      include: { objetivoRef: true, modalidadRef: true },
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

  findAllActive({ objetivoId, nivel, modalidadId, paymentExpired }: StudentFilters) {
    return db.student.findMany({
      where: {
        isActive: true,
        objetivoId,
        nivel,
        modalidadId,
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
