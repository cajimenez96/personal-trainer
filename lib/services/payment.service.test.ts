import { describe, expect, it } from "vitest"
import { PaymentService } from "./payment.service"
import { calculateExpirationDate } from "./subscription.service"
import type {
  CreatePaymentData,
  CreateSubscriptionData,
  IPaymentRepository,
  ISubscriptionRepository,
  PaymentDTO,
  PaymentWithSubscription,
  StudentSubscriptionWithPlan,
} from "@/lib/repositories/interfaces"

class FakePaymentRepository implements IPaymentRepository {
  public payments: PaymentDTO[] = []

  async create(data: CreatePaymentData): Promise<PaymentDTO> {
    const payment: PaymentDTO = {
      id: `pay-${Date.now()}-${Math.random()}`,
      studentId: data.studentId,
      subscriptionId: data.subscriptionId ?? null,
      amount: data.amount,
      paidAt: data.paidAt,
      notes: data.notes ?? null,
      createdAt: new Date(),
    }
    this.payments.push(payment)
    return payment
  }

  async findByStudentId(studentId: string): Promise<PaymentWithSubscription[]> {
    return this.payments
      .filter((p) => p.studentId === studentId)
      .map((p) => ({
        ...p,
        subscription: null,
      }))
  }

  async findById(id: string): Promise<PaymentDTO | null> {
    return this.payments.find((p) => p.id === id) ?? null
  }

  async delete(id: string): Promise<void> {
    this.payments = this.payments.filter((p) => p.id !== id)
  }
}

class FakeSubscriptionRepository implements ISubscriptionRepository {
  public subscriptions: StudentSubscriptionWithPlan[] = []

  async create(data: CreateSubscriptionData): Promise<StudentSubscriptionWithPlan> {
    const sub: StudentSubscriptionWithPlan = {
      id: `sub-${Date.now()}-${Math.random()}`,
      studentId: data.studentId,
      planId: data.planId,
      priceSnapshot: data.priceSnapshot,
      startDate: data.startDate,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
      plan: {
        id: data.planId,
        trainerId: "test-trainer-id",
        name: "Plan Mensual",
        description: null,
        price: data.priceSnapshot,
        durationDays: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }
    this.subscriptions.push(sub)
    return sub
  }

  async findByStudentId(studentId: string): Promise<StudentSubscriptionWithPlan[]> {
    return this.subscriptions.filter((s) => s.studentId === studentId)
  }

  async findLatestByStudentId(studentId: string): Promise<StudentSubscriptionWithPlan | null> {
    return this.subscriptions.filter((s) => s.studentId === studentId)[0] ?? null
  }

  async findById(id: string): Promise<StudentSubscriptionWithPlan | null> {
    return this.subscriptions.find((s) => s.id === id) ?? null
  }
}

describe("Subscription expiration calculation", () => {
  it("computes expiration correctly by adding duration in days", () => {
    const start = new Date(2026, 8, 1) // Sep 1, 2026
    const expires = calculateExpirationDate(start, 30)
    expect(expires.getDate()).toBe(1)
    expect(expires.getMonth()).toBe(9) // Oct 1, 2026
  })
})

describe("PaymentService (Ledger / Cuenta Corriente)", () => {
  it("calculates balance correctly with partial payments", async () => {
    const payRepo = new FakePaymentRepository()
    const subRepo = new FakeSubscriptionRepository()
    const service = new PaymentService(payRepo, subRepo)

    const studentId = "student-123"

    // Subscribed to a plan of 30,000
    await subRepo.create({
      studentId,
      planId: "plan-1",
      priceSnapshot: 30000,
      startDate: new Date(2026, 8, 1),
      expiresAt: new Date(2026, 9, 1),
    })

    // No payments yet
    let statement = await service.getAccountStatement(studentId)
    expect(statement.totalCharges).toBe(30000)
    expect(statement.totalPaid).toBe(0)
    expect(statement.balance).toBe(30000)

    // First partial payment of 10,000
    await service.registerPayment({
      studentId,
      amount: 10000,
      paidAt: new Date(2026, 8, 5),
      notes: "Transferencia parcial",
    })

    statement = await service.getAccountStatement(studentId)
    expect(statement.totalPaid).toBe(10000)
    expect(statement.balance).toBe(20000)

    // Second payment of 20,000 (settles debt)
    await service.registerPayment({
      studentId,
      amount: 20000,
      paidAt: new Date(2026, 8, 10),
      notes: "Pago final",
    })

    statement = await service.getAccountStatement(studentId)
    expect(statement.totalPaid).toBe(30000)
    expect(statement.balance).toBe(0)
    expect(statement.transactions.length).toBe(3) // 1 charge + 2 payments
  })

  it("rejects payments with amount <= 0", async () => {
    const payRepo = new FakePaymentRepository()
    const subRepo = new FakeSubscriptionRepository()
    const service = new PaymentService(payRepo, subRepo)

    await expect(
      service.registerPayment({
        studentId: "student-1",
        amount: 0,
        paidAt: new Date(),
      }),
    ).rejects.toThrow()
  })
})
