import { db } from "@/lib/db"
import type {
  CreatePlanData,
  IPlanRepository,
  PlanDTO,
  PlanMetricsDTO,
  PlanMetricsItemDTO,
  UpdatePlanData,
} from "@/lib/repositories/interfaces"
import { planRepository } from "@/lib/repositories/plan.repository"

export const MAX_ACTIVE_PLANS = 3

export class PlanLimitReachedError extends Error {
  constructor(max = MAX_ACTIVE_PLANS) {
    super(`Límite alcanzado: no podés tener más de ${max} planes activos simultáneamente.`)
    this.name = "PlanLimitReachedError"
  }
}

export class PlanNameAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Ya existe un plan con el nombre "${name}".`)
    this.name = "PlanNameAlreadyExistsError"
  }
}

export class PlanInUseError extends Error {
  constructor(count: number) {
    super(`No se puede eliminar el plan porque tiene ${count} suscripciones registradas. Podés desactivarlo en su lugar.`)
    this.name = "PlanInUseError"
  }
}

export class PlanService {
  constructor(private readonly repo: IPlanRepository) {}

  async list(includeInactive = false): Promise<PlanDTO[]> {
    return this.repo.findAll(includeInactive)
  }

  async getById(id: string): Promise<PlanDTO | null> {
    return this.repo.findById(id)
  }

  async countActive(): Promise<number> {
    return this.repo.countActive()
  }

  async create(data: CreatePlanData): Promise<PlanDTO> {
    const activeCount = await this.repo.countActive()
    if (activeCount >= MAX_ACTIVE_PLANS) {
      throw new PlanLimitReachedError(MAX_ACTIVE_PLANS)
    }

    const existing = await this.repo.findByName(data.name.trim())
    if (existing) {
      throw new PlanNameAlreadyExistsError(data.name.trim())
    }

    return this.repo.create({
      ...data,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      price: Number(data.price),
      durationDays: data.durationDays && data.durationDays > 0 ? Number(data.durationDays) : 30,
    })
  }

  async update(id: string, data: UpdatePlanData): Promise<PlanDTO> {
    const current = await this.repo.findById(id)
    if (!current) {
      throw new Error("Plan no encontrado.")
    }

    // If reactivating, ensure limit is not exceeded
    if (data.isActive && !current.isActive) {
      const activeCount = await this.repo.countActive()
      if (activeCount >= MAX_ACTIVE_PLANS) {
        throw new PlanLimitReachedError(MAX_ACTIVE_PLANS)
      }
    }

    // Check unique name if renamed
    if (data.name && data.name.trim() !== current.name) {
      const existing = await this.repo.findByName(data.name.trim())
      if (existing && existing.id !== id) {
        throw new PlanNameAlreadyExistsError(data.name.trim())
      }
    }

    return this.repo.update(id, {
      ...data,
      name: data.name.trim(),
      description: data.description !== undefined ? data.description?.trim() || null : current.description,
      price: Number(data.price),
      durationDays: data.durationDays && data.durationDays > 0 ? Number(data.durationDays) : current.durationDays,
    })
  }

  async delete(id: string): Promise<void> {
    const subsCount = await this.repo.countSubscriptions(id)
    if (subsCount > 0) {
      throw new PlanInUseError(subsCount)
    }
    await this.repo.delete(id)
  }

  async getPlanMetrics(): Promise<PlanMetricsDTO> {
    const plans = await this.repo.findAll(false)
    const activePlansCount = plans.length

    // Active students with their latest subscription
    const activeStudents = await db.student.findMany({
      where: { isActive: true },
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

    const studentCountByPlan = new Map<string, number>()
    let unassignedCount = 0

    for (const student of activeStudents) {
      const latestSub = student.subscriptions[0]
      if (latestSub?.planId) {
        studentCountByPlan.set(
          latestSub.planId,
          (studentCountByPlan.get(latestSub.planId) ?? 0) + 1,
        )
      } else {
        unassignedCount++
      }
    }

    const planItems: PlanMetricsItemDTO[] = plans.map((p) => {
      const count = studentCountByPlan.get(p.id) ?? 0
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        durationDays: p.durationDays,
        isActive: p.isActive,
        activeStudentsCount: count,
        estimatedMonthlyRevenue: count * p.price,
      }
    })

    return {
      activePlansCount,
      maxActivePlans: MAX_ACTIVE_PLANS,
      plans: planItems,
      unassignedStudentsCount: unassignedCount,
    }
  }
}

export const planService = new PlanService(planRepository)

