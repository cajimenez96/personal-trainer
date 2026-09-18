import { db } from "@/lib/db"
import { getDefaultTrainerId } from "@/lib/tenant"
import type {
  AccountStatement,
  FinancialSummaryDTO,
  IPaymentRepository,
  ISubscriptionRepository,
  LedgerTransaction,
} from "@/lib/repositories/interfaces"
import { paymentRepository } from "@/lib/repositories/payment.repository"
import { subscriptionRepository } from "@/lib/repositories/subscription.repository"

export class PaymentService {
  constructor(
    private readonly payRepo: IPaymentRepository,
    private readonly subRepo: ISubscriptionRepository,
  ) {}

  async registerPayment(params: {
    studentId: string
    amount: number
    paidAt: Date
    notes?: string | null
    subscriptionId?: string | null
  }) {
    if (params.amount <= 0) {
      throw new Error("El monto del pago debe ser mayor a 0.")
    }

    return this.payRepo.create({
      studentId: params.studentId,
      amount: params.amount,
      paidAt: params.paidAt,
      notes: params.notes?.trim() || null,
      subscriptionId: params.subscriptionId || null,
    })
  }

  async deletePayment(id: string): Promise<void> {
    await this.payRepo.delete(id)
  }

  async getAccountStatement(studentId: string): Promise<AccountStatement> {
    const [subscriptions, payments] = await Promise.all([
      this.subRepo.findByStudentId(studentId),
      this.payRepo.findByStudentId(studentId),
    ])

    const transactions: LedgerTransaction[] = []

    let totalCharges = 0
    for (const sub of subscriptions) {
      const chargeAmount = Number(sub.priceSnapshot)
      totalCharges += chargeAmount
      transactions.push({
        id: `sub-${sub.id}`,
        type: "CHARGE",
        date: sub.startDate,
        description: `Plan: ${sub.plan.name} (${sub.plan.durationDays} días)`,
        amount: chargeAmount,
        referenceId: sub.id,
      })
    }

    let totalPaid = 0
    for (const pay of payments) {
      const payAmount = Number(pay.amount)
      totalPaid += payAmount
      transactions.push({
        id: pay.id,
        type: "PAYMENT",
        date: pay.paidAt,
        description: pay.notes || "Pago registrado",
        amount: payAmount,
        referenceId: pay.id,
      })
    }

    // Sort chronologically descending (newest first)
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime())

    const balance = totalCharges - totalPaid

    return {
      totalCharges,
      totalPaid,
      balance,
      transactions,
    }
  }

  async getFinancialSummary(trainerId?: string): Promise<FinancialSummaryDTO> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [monthlyPayments, allTimePayments, activeStudents] = await Promise.all([
      db.payment.aggregate({
        _sum: { amount: true },
        where: {
          student: { trainerId: effectiveTrainerId },
          paidAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: {
          student: { trainerId: effectiveTrainerId },
        },
      }),
      db.student.findMany({
        where: { trainerId: effectiveTrainerId, isActive: true },
        select: { id: true },
      }),
    ])

    const monthlyRevenue = Number(monthlyPayments._sum.amount ?? 0)
    const totalPaidAllTime = Number(allTimePayments._sum.amount ?? 0)

    const activeStudentIds = activeStudents.map((s) => s.id)

    if (activeStudentIds.length === 0) {
      return {
        monthlyRevenue,
        totalPendingBalance: 0,
        debtorStudentsCount: 0,
        totalPaidAllTime,
      }
    }

    const [subSums, paySums] = await Promise.all([
      db.studentSubscription.groupBy({
        by: ["studentId"],
        where: { studentId: { in: activeStudentIds } },
        _sum: { priceSnapshot: true },
      }),
      db.payment.groupBy({
        by: ["studentId"],
        where: { studentId: { in: activeStudentIds } },
        _sum: { amount: true },
      }),
    ])

    const payMap = new Map<string, number>()
    for (const p of paySums) {
      payMap.set(p.studentId, Number(p._sum.amount ?? 0))
    }

    let totalPendingBalance = 0
    let debtorStudentsCount = 0

    for (const s of subSums) {
      const totalCharges = Number(s._sum.priceSnapshot ?? 0)
      const totalPaid = payMap.get(s.studentId) ?? 0
      const balance = totalCharges - totalPaid
      if (balance > 0) {
        totalPendingBalance += balance
        debtorStudentsCount++
      }
    }

    return {
      monthlyRevenue,
      totalPendingBalance,
      debtorStudentsCount,
      totalPaidAllTime,
    }
  }
}

export const paymentService = new PaymentService(
  paymentRepository,
  subscriptionRepository,
)
