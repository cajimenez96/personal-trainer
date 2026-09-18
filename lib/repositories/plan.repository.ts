import { db } from "@/lib/db"
import { getDefaultTrainerId } from "@/lib/tenant"
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
    trainerId: plan.trainerId,
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
  async findAll(includeInactive = false, trainerId?: string): Promise<PlanDTO[]> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    const plans = await db.plan.findMany({
      where: {
        trainerId: effectiveTrainerId,
        ...(includeInactive ? {} : { isActive: true }),
      },
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

  async findByName(name: string, trainerId?: string): Promise<PlanDTO | null> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    const plan = await db.plan.findUnique({
      where: {
        unique_plan_per_trainer: {
          trainerId: effectiveTrainerId,
          name,
        },
      },
    })
    return plan ? toPlanDTO(plan) : null
  }

  async create(data: CreatePlanData): Promise<PlanDTO> {
    const effectiveTrainerId = data.trainerId ?? (await getDefaultTrainerId())
    const plan = await db.plan.create({
      data: {
        trainerId: effectiveTrainerId,
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

  async countActive(trainerId?: string): Promise<number> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    return db.plan.count({
      where: { trainerId: effectiveTrainerId, isActive: true },
    })
  }

  async countSubscriptions(planId: string): Promise<number> {
    return db.studentSubscription.count({
      where: { planId },
    })
  }
}

export const planRepository = new PrismaPlanRepository()
