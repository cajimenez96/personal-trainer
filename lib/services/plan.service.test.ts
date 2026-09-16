import { describe, expect, it } from "vitest"
import {
  MAX_ACTIVE_PLANS,
  PlanLimitReachedError,
  PlanNameAlreadyExistsError,
  PlanService,
} from "./plan.service"
import type {
  CreatePlanData,
  IPlanRepository,
  PlanDTO,
  UpdatePlanData,
} from "@/lib/repositories/interfaces"

class FakePlanRepository implements IPlanRepository {
  public plans: PlanDTO[] = []

  async findAll(includeInactive = false): Promise<PlanDTO[]> {
    return includeInactive ? this.plans : this.plans.filter((p) => p.isActive)
  }

  async findById(id: string): Promise<PlanDTO | null> {
    return this.plans.find((p) => p.id === id) ?? null
  }

  async findByName(name: string): Promise<PlanDTO | null> {
    return (
      this.plans.find((p) => p.name.toLowerCase() === name.toLowerCase()) ?? null
    )
  }

  async create(data: CreatePlanData): Promise<PlanDTO> {
    const plan: PlanDTO = {
      id: `plan-${Date.now()}-${Math.random()}`,
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      durationDays: data.durationDays ?? 30,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.plans.push(plan)
    return plan
  }

  async update(id: string, data: UpdatePlanData): Promise<PlanDTO> {
    const index = this.plans.findIndex((p) => p.id === id)
    if (index === -1) throw new Error("Plan not found")
    const existing = this.plans[index]
    const updated: PlanDTO = {
      ...existing,
      name: data.name ?? existing.name,
      description: data.description !== undefined ? data.description : existing.description,
      price: data.price !== undefined ? data.price : existing.price,
      durationDays: data.durationDays ?? existing.durationDays,
      isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      updatedAt: new Date(),
    }
    this.plans[index] = updated
    return updated
  }

  async delete(id: string): Promise<void> {
    this.plans = this.plans.filter((p) => p.id !== id)
  }

  async countActive(): Promise<number> {
    return this.plans.filter((p) => p.isActive).length
  }

  async countSubscriptions(): Promise<number> {
    return 0
  }
}

describe("PlanService", () => {
  it("allows creating up to MAX_ACTIVE_PLANS (3)", async () => {
    const repo = new FakePlanRepository()
    const service = new PlanService(repo)

    await service.create({ name: "Plan 1", price: 10000, durationDays: 30 })
    await service.create({ name: "Plan 2", price: 20000, durationDays: 60 })
    await service.create({ name: "Plan 3", price: 30000, durationDays: 90 })

    expect(await service.countActive()).toBe(3)
  })

  it("throws PlanLimitReachedError when attempting to create a 4th active plan", async () => {
    const repo = new FakePlanRepository()
    const service = new PlanService(repo)

    for (let i = 1; i <= MAX_ACTIVE_PLANS; i++) {
      await service.create({ name: `Plan ${i}`, price: 10000 * i, durationDays: 30 })
    }

    await expect(
      service.create({ name: "Plan 4", price: 40000, durationDays: 30 }),
    ).rejects.toThrow(PlanLimitReachedError)
  })

  it("throws PlanNameAlreadyExistsError on duplicate plan name", async () => {
    const repo = new FakePlanRepository()
    const service = new PlanService(repo)

    await service.create({ name: "Pase Libre", price: 25000, durationDays: 30 })
    await expect(
      service.create({ name: "Pase Libre", price: 30000, durationDays: 30 }),
    ).rejects.toThrow(PlanNameAlreadyExistsError)
  })
})
