import { db } from "@/lib/db"
import type {
  CreatePaymentData,
  IPaymentRepository,
  PaymentDTO,
  PaymentWithSubscription,
} from "@/lib/repositories/interfaces"
import { toPlanDTO } from "@/lib/repositories/plan.repository"

function toPaymentDTO(row: any): PaymentDTO {
  return {
    id: row.id,
    studentId: row.studentId,
    subscriptionId: row.subscriptionId,
    amount: Number(row.amount),
    paidAt: row.paidAt,
    notes: row.notes,
    createdAt: row.createdAt,
  }
}

function toPaymentWithSubscription(row: any): PaymentWithSubscription {
  return {
    ...toPaymentDTO(row),
    subscription: row.subscription
      ? {
          id: row.subscription.id,
          studentId: row.subscription.studentId,
          planId: row.subscription.planId,
          priceSnapshot: Number(row.subscription.priceSnapshot),
          startDate: row.subscription.startDate,
          expiresAt: row.subscription.expiresAt,
          createdAt: row.subscription.createdAt,
          plan: toPlanDTO(row.subscription.plan),
        }
      : null,
  }
}

export class PrismaPaymentRepository implements IPaymentRepository {
  async create(data: CreatePaymentData): Promise<PaymentDTO> {
    const row = await db.payment.create({
      data: {
        studentId: data.studentId,
        subscriptionId: data.subscriptionId,
        amount: data.amount,
        paidAt: data.paidAt,
        notes: data.notes,
      },
    })
    return toPaymentDTO(row)
  }

  async findByStudentId(studentId: string): Promise<PaymentWithSubscription[]> {
    const rows = await db.payment.findMany({
      where: { studentId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: { paidAt: "desc" },
    })
    return rows.map(toPaymentWithSubscription)
  }

  async findById(id: string): Promise<PaymentDTO | null> {
    const row = await db.payment.findUnique({
      where: { id },
    })
    return row ? toPaymentDTO(row) : null
  }

  async delete(id: string): Promise<void> {
    await db.payment.delete({
      where: { id },
    })
  }
}

export const paymentRepository = new PrismaPaymentRepository()
