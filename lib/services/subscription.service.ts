import { db } from "@/lib/db"
import type {
  IPlanRepository,
  ISubscriptionRepository,
  StudentSubscriptionWithPlan,
} from "@/lib/repositories/interfaces"
import { planRepository } from "@/lib/repositories/plan.repository"
import { subscriptionRepository } from "@/lib/repositories/subscription.repository"

export function calculateExpirationDate(startDate: Date, durationDays: number): Date {
  const expires = new Date(startDate)
  expires.setDate(expires.getDate() + durationDays)
  return expires
}

export class SubscriptionService {
  constructor(
    private readonly subRepo: ISubscriptionRepository,
    private readonly pRepo: IPlanRepository,
  ) {}

  async getLatestByStudentId(studentId: string): Promise<StudentSubscriptionWithPlan | null> {
    return this.subRepo.findLatestByStudentId(studentId)
  }

  async listByStudentId(studentId: string): Promise<StudentSubscriptionWithPlan[]> {
    return this.subRepo.findByStudentId(studentId)
  }

  async assignPlan(params: {
    studentId: string
    planId: string
    startDate: Date
  }): Promise<StudentSubscriptionWithPlan> {
    const student = await db.student.findUnique({
      where: { id: params.studentId },
    })
    if (!student || !student.isActive) {
      throw new Error("Alumno no encontrado o inactivo.")
    }

    const plan = await this.pRepo.findById(params.planId)
    if (!plan || !plan.isActive) {
      throw new Error("El plan seleccionado no existe o está inactivo.")
    }

    const expiresAt = calculateExpirationDate(params.startDate, plan.durationDays)
    const priceSnapshot = Number(plan.price)

    // Create subscription snapshot
    const subscription = await this.subRepo.create({
      studentId: params.studentId,
      planId: params.planId,
      priceSnapshot,
      startDate: params.startDate,
      expiresAt,
    })

    // Synchronize legacy fields on student for compatibility with existing WhatsApp & list queries
    await db.student.update({
      where: { id: params.studentId },
      data: {
        paymentExpiresAt: expiresAt,
        ...(student.membershipStartsAt ? {} : { membershipStartsAt: params.startDate }),
      },
    })

    return subscription
  }
}

export const subscriptionService = new SubscriptionService(
  subscriptionRepository,
  planRepository,
)
