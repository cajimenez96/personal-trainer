import { db } from "@/lib/db"
import { getDefaultTrainerId } from "@/lib/tenant"
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

export type PlanLimitsLookup = (
  trainerId: string,
) => Promise<{ maxPlans: number } | null>

export class PlanService {
  constructor(
    private readonly repo: IPlanRepository,
    private readonly limitsLookup?: PlanLimitsLookup,
  ) {}

  private async getMaxPlans(trainerId?: string): Promise<number> {
    if (!trainerId) return MAX_ACTIVE_PLANS
    if (this.limitsLookup) {
      const res = await this.limitsLookup(trainerId)
      return res?.maxPlans ?? MAX_ACTIVE_PLANS
    }
    try {
      const trainer = await db.trainer.findUnique({
        where: { id: trainerId },
        select: { maxPlans: true },
      })
      return trainer?.maxPlans ?? MAX_ACTIVE_PLANS
    } catch {
      return MAX_ACTIVE_PLANS
    }
  }

  async list(includeInactive = false, trainerId?: string): Promise<PlanDTO[]> {
    return this.repo.findAll(includeInactive, trainerId)
  }

  async getById(id: string): Promise<PlanDTO | null> {
    return this.repo.findById(id)
  }

  async countActive(trainerId?: string): Promise<number> {
    return this.repo.countActive(trainerId)
  }

  async create(data: CreatePlanData): Promise<PlanDTO> {
    const maxPlans = await this.getMaxPlans(data.trainerId)
    const activeCount = await this.repo.countActive(data.trainerId)
    if (activeCount >= maxPlans) {
      throw new PlanLimitReachedError(maxPlans)
    }

    const existing = await this.repo.findByName(data.name.trim(), data.trainerId)
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
      const maxPlans = await this.getMaxPlans(current.trainerId)
      const activeCount = await this.repo.countActive(current.trainerId)
      if (activeCount >= maxPlans) {
        throw new PlanLimitReachedError(maxPlans)
      }
    }

    // Check unique name if renamed
    if (data.name && data.name.trim() !== current.name) {
      const existing = await this.repo.findByName(data.name.trim(), current.trainerId)
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

  async getPlanMetrics(trainerId?: string): Promise<PlanMetricsDTO> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    const plans = await this.repo.findAll(false, effectiveTrainerId)
    const activePlansCount = plans.length

    // Active students with their latest subscription for this trainer
    const activeStudents = await db.student.findMany({
      where: { trainerId: effectiveTrainerId, isActive: true },
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
        trainerId: p.trainerId,
        name: p.name,
        price: p.price,
        durationDays: p.durationDays,
        isActive: p.isActive,
        activeStudentsCount: count,
        estimatedMonthlyRevenue: count * p.price,
      }
    })

    const maxActivePlans = await this.getMaxPlans(effectiveTrainerId)

    return {
      activePlansCount,
      maxActivePlans,
      plans: planItems,
      unassignedStudentsCount: unassignedCount,
    }
  }
}

export const planService = new PlanService(planRepository)


