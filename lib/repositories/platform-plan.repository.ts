import { db } from "@/lib/db";
import type { PlatformPlan as PrismaPlatformPlan } from "@/app/generated/prisma/client";

export type PlatformPlanDTO = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  trialDays: number;
  maxStudents: number;
  maxPlans: number;
  maxGenericProfiles: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function toPlatformPlanDTO(plan: PrismaPlatformPlan): PlatformPlanDTO {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: Number(plan.price),
    durationDays: plan.durationDays,
    trialDays: plan.trialDays,
    maxStudents: plan.maxStudents,
    maxPlans: plan.maxPlans,
    maxGenericProfiles: plan.maxGenericProfiles,
    isActive: plan.isActive,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

export class PrismaPlatformPlanRepository {
  async findAll(includeInactive = false): Promise<PlatformPlanDTO[]> {
    const plans = await db.platformPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { price: "asc" },
    });
    return plans.map(toPlatformPlanDTO);
  }

  async findById(id: string): Promise<PlatformPlanDTO | null> {
    const plan = await db.platformPlan.findUnique({
      where: { id },
    });
    return plan ? toPlatformPlanDTO(plan) : null;
  }

  async findByName(name: string): Promise<PlatformPlanDTO | null> {
    const plan = await db.platformPlan.findUnique({
      where: { name },
    });
    return plan ? toPlatformPlanDTO(plan) : null;
  }

  async create(data: {
    name: string;
    description?: string | null;
    price: number;
    durationDays: number;
    trialDays?: number;
    maxStudents: number;
    maxPlans: number;
    maxGenericProfiles: number;
    isActive?: boolean;
  }): Promise<PlatformPlanDTO> {
    const plan = await db.platformPlan.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        price: data.price,
        durationDays: data.durationDays,
        trialDays: data.trialDays ?? 0,
        maxStudents: data.maxStudents,
        maxPlans: data.maxPlans,
        maxGenericProfiles: data.maxGenericProfiles,
        isActive: data.isActive ?? true,
      },
    });
    return toPlatformPlanDTO(plan);
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      price?: number;
      durationDays?: number;
      trialDays?: number;
      maxStudents?: number;
      maxPlans?: number;
      maxGenericProfiles?: number;
      isActive?: boolean;
    }
  ): Promise<PlatformPlanDTO> {
    const plan = await db.platformPlan.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined
          ? { description: data.description?.trim() || null }
          : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.durationDays !== undefined ? { durationDays: data.durationDays } : {}),
        ...(data.trialDays !== undefined ? { trialDays: data.trialDays } : {}),
        ...(data.maxStudents !== undefined ? { maxStudents: data.maxStudents } : {}),
        ...(data.maxPlans !== undefined ? { maxPlans: data.maxPlans } : {}),
        ...(data.maxGenericProfiles !== undefined
          ? { maxGenericProfiles: data.maxGenericProfiles }
          : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
    return toPlatformPlanDTO(plan);
  }

  async setGlobalTrialDays(trialDays: number): Promise<number> {
    const result = await db.platformPlan.updateMany({
      data: { trialDays },
    });
    return result.count;
  }

  async delete(id: string): Promise<void> {
    await db.platformPlan.delete({
      where: { id },
    });
  }

  async countUsage(id: string): Promise<{ coachesCount: number; subscriptionsCount: number }> {
    const [coachesCount, subscriptionsCount] = await Promise.all([
      db.trainer.count({ where: { platformPlanId: id } }),
      db.trainerSubscription.count({ where: { planId: id } }),
    ]);
    return { coachesCount, subscriptionsCount };
  }
}

export const platformPlanRepository = new PrismaPlatformPlanRepository();
