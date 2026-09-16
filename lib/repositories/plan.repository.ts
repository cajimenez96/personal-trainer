import { db } from "@/lib/db"
import type { Plan as PrismaPlan } from "@/app/generated/prisma/client"
import type {
  CreatePlanData,
  IPlanRepository,
  PlanDTO,
  UpdatePlanData,
} from "@/lib/repositories/interfaces"

export function toPlanDTO(plan: PrismaPlan): PlanDTO {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: Number(plan.price),
    durationDays: plan.durationDays,
    isActive: plan.isActive,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  }
}

export class PrismaPlanRepository implements IPlanRepository {
  async findAll(includeInactive = false): Promise<PlanDTO[]> {
    const plans = await db.plan.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { createdAt: "asc" },
    })
    return plans.map(toPlanDTO)
  }

  async findById(id: string): Promise<PlanDTO | null> {
    const plan = await db.plan.findUnique({
      where: { id },
    })
    return plan ? toPlanDTO(plan) : null
  }

  async findByName(name: string): Promise<PlanDTO | null> {
    const plan = await db.plan.findUnique({
      where: { name },
    })
    return plan ? toPlanDTO(plan) : null
  }

  async create(data: CreatePlanData): Promise<PlanDTO> {
    const plan = await db.plan.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        durationDays: data.durationDays ?? 30,
      },
    })
    return toPlanDTO(plan)
  }

  async update(id: string, data: UpdatePlanData): Promise<PlanDTO> {
    const plan = await db.plan.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        durationDays: data.durationDays,
        isActive: data.isActive,
      },
    })
    return toPlanDTO(plan)
  }

  async delete(id: string): Promise<void> {
    await db.plan.delete({
      where: { id },
    })
  }

  async countActive(): Promise<number> {
    return db.plan.count({
      where: { isActive: true },
    })
  }

  async countSubscriptions(planId: string): Promise<number> {
    return db.studentSubscription.count({
      where: { planId },
    })
  }
}

export const planRepository = new PrismaPlanRepository()
