import { describe, expect, it } from "vitest";
import {
  PlatformPlanNameAlreadyExistsError,
  PlatformPlanNotFoundError,
  PlatformPlanInUseError,
  PlatformPlanService,
} from "./platform-plan.service";
import type {
  PlatformPlanDTO,
  PrismaPlatformPlanRepository,
} from "@/lib/repositories/platform-plan.repository";

class FakePlatformPlanRepository {
  public plans: PlatformPlanDTO[] = [];
  public coachesCount = 0;
  public subscriptionsCount = 0;

  async findAll(includeInactive = false): Promise<PlatformPlanDTO[]> {
    return includeInactive ? this.plans : this.plans.filter((p) => p.isActive);
  }

  async findById(id: string): Promise<PlatformPlanDTO | null> {
    return this.plans.find((p) => p.id === id) ?? null;
  }

  async findByName(name: string): Promise<PlatformPlanDTO | null> {
    return (
      this.plans.find((p) => p.name.toLowerCase() === name.toLowerCase()) ??
      null
    );
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
    const plan: PlatformPlanDTO = {
      id: `plan-${Date.now()}-${Math.random()}`,
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      durationDays: data.durationDays,
      trialDays: data.trialDays ?? 0,
      maxStudents: data.maxStudents,
      maxPlans: data.maxPlans,
      maxGenericProfiles: data.maxGenericProfiles,
      isActive: data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.plans.push(plan);
    return plan;
  }

  async update(
    id: string,
    data: Partial<PlatformPlanDTO>
  ): Promise<PlatformPlanDTO> {
    const idx = this.plans.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Not found");
    const existing = this.plans[idx];
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.plans[idx] = updated;
    return updated;
  }

  async setGlobalTrialDays(trialDays: number): Promise<number> {
    for (const plan of this.plans) {
      plan.trialDays = trialDays;
    }
    return this.plans.length;
  }

  async delete(id: string): Promise<void> {
    this.plans = this.plans.filter((p) => p.id !== id);
  }

  async countUsage(_id: string) {
    return {
      coachesCount: this.coachesCount,
      subscriptionsCount: this.subscriptionsCount,
    };
  }
}

describe("PlatformPlanService", () => {
  it("crea un plan exitosamente si el nombre no existe", async () => {
    const repo = new FakePlatformPlanRepository();
    const service = new PlatformPlanService(
      repo as unknown as PrismaPlatformPlanRepository
    );

    const plan = await service.create({
      name: "Plan Básico",
      description: "Inicial",
      price: 10000,
      durationDays: 30,
      maxStudents: 10,
      maxPlans: 1,
      maxGenericProfiles: 3,
      isActive: true,
    });

    expect(plan.id).toBeDefined();
    expect(plan.name).toBe("Plan Básico");
    expect(plan.price).toBe(10000);
  });

  it("lanza error si se intenta crear un plan con nombre duplicado", async () => {
    const repo = new FakePlatformPlanRepository();
    const service = new PlatformPlanService(
      repo as unknown as PrismaPlatformPlanRepository
    );

    await service.create({
      name: "Plan Pro",
      price: 20000,
      durationDays: 30,
      maxStudents: 50,
      maxPlans: 5,
      maxGenericProfiles: 5,
      isActive: true,
    });

    await expect(
      service.create({
        name: "plan pro",
        price: 25000,
        durationDays: 30,
        maxStudents: 100,
        maxPlans: 10,
        maxGenericProfiles: 5,
        isActive: true,
      })
    ).rejects.toThrow(PlatformPlanNameAlreadyExistsError);
  });

  it("permite pausar/activar un plan con toggleActive", async () => {
    const repo = new FakePlatformPlanRepository();
    const service = new PlatformPlanService(
      repo as unknown as PrismaPlatformPlanRepository
    );

    const plan = await service.create({
      name: "Plan Temporal",
      price: 5000,
      durationDays: 15,
      maxStudents: 5,
      maxPlans: 1,
      maxGenericProfiles: 1,
      isActive: true,
    });

    const toggled = await service.toggleActive(plan.id, false);
    expect(toggled.isActive).toBe(false);

    const activeList = await service.list(false);
    expect(activeList.length).toBe(0);

    const fullList = await service.list(true);
    expect(fullList.length).toBe(1);
  });

  it("bloquea la eliminación si el plan tiene coaches o suscripciones asociadas", async () => {
    const repo = new FakePlatformPlanRepository();
    repo.coachesCount = 3;
    repo.subscriptionsCount = 5;

    const service = new PlatformPlanService(
      repo as unknown as PrismaPlatformPlanRepository
    );

    const plan = await service.create({
      name: "Plan Gym",
      price: 50000,
      durationDays: 30,
      maxStudents: 100,
      maxPlans: 20,
      maxGenericProfiles: 10,
      isActive: true,
    });

    await expect(service.delete(plan.id)).rejects.toThrow(
      PlatformPlanInUseError
    );
  });

  it("actualiza los días de prueba de todos los planes con setGlobalTrialDays", async () => {
    const repo = new FakePlatformPlanRepository();
    const service = new PlatformPlanService(
      repo as unknown as PrismaPlatformPlanRepository
    );

    await service.create({
      name: "Plan A",
      price: 10000,
      durationDays: 30,
      trialDays: 0,
      maxStudents: 10,
      maxPlans: 2,
      maxGenericProfiles: 2,
    });

    await service.create({
      name: "Plan B",
      price: 20000,
      durationDays: 30,
      trialDays: 5,
      maxStudents: 20,
      maxPlans: 5,
      maxGenericProfiles: 5,
    });

    const updatedCount = await service.setGlobalTrialDays(14);
    expect(updatedCount).toBe(2);

    const plans = await service.list(true);
    expect(plans[0].trialDays).toBe(14);
    expect(plans[1].trialDays).toBe(14);
  });
});
