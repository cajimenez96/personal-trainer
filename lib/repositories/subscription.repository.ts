import { db } from "@/lib/db"
import type {
  CreateSubscriptionData,
  ISubscriptionRepository,
  StudentSubscriptionWithPlan,
} from "@/lib/repositories/interfaces"
import { toPlanDTO } from "@/lib/repositories/plan.repository"

function toSubscriptionWithPlan(row: any): StudentSubscriptionWithPlan {
  return {
    id: row.id,
    studentId: row.studentId,
    planId: row.planId,
    priceSnapshot: Number(row.priceSnapshot),
    startDate: row.startDate,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    plan: toPlanDTO(row.plan),
  }
}

export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  async create(data: CreateSubscriptionData): Promise<StudentSubscriptionWithPlan> {
    const row = await db.studentSubscription.create({
      data: {
        studentId: data.studentId,
        planId: data.planId,
        priceSnapshot: data.priceSnapshot,
        startDate: data.startDate,
        expiresAt: data.expiresAt,
      },
      include: {
        plan: true,
      },
    })
    return toSubscriptionWithPlan(row)
  }

  async findByStudentId(studentId: string): Promise<StudentSubscriptionWithPlan[]> {
    const rows = await db.studentSubscription.findMany({
      where: { studentId },
      include: {
        plan: true,
      },
      orderBy: { startDate: "desc" },
    })
    return rows.map(toSubscriptionWithPlan)
  }

  async findLatestByStudentId(studentId: string): Promise<StudentSubscriptionWithPlan | null> {
    const row = await db.studentSubscription.findFirst({
      where: { studentId },
      include: {
        plan: true,
      },
      orderBy: { startDate: "desc" },
    })
    return row ? toSubscriptionWithPlan(row) : null
  }

  async findById(id: string): Promise<StudentSubscriptionWithPlan | null> {
    const row = await db.studentSubscription.findUnique({
      where: { id },
      include: {
        plan: true,
      },
    })
    return row ? toSubscriptionWithPlan(row) : null
  }
}

export const subscriptionRepository = new PrismaSubscriptionRepository()
