import {
  platformPlanRepository,
  type PlatformPlanDTO,
  type PrismaPlatformPlanRepository,
} from "@/lib/repositories/platform-plan.repository";
import {
  createPlatformPlanSchema,
  updatePlatformPlanSchema,
  type CreatePlatformPlanInput,
  type UpdatePlatformPlanInput,
} from "@/lib/validators/platform-plan";

export class PlatformPlanNameAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Ya existe un plan de plataforma con el nombre "${name}".`);
    this.name = "PlatformPlanNameAlreadyExistsError";
  }
}

export class PlatformPlanNotFoundError extends Error {
  constructor(id: string) {
    super(`No se encontró el plan de plataforma con ID "${id}".`);
    this.name = "PlatformPlanNotFoundError";
  }
}

export class PlatformPlanInUseError extends Error {
  constructor(coachesCount: number, subscriptionsCount: number) {
    super(
      `No se puede eliminar el plan porque tiene ${coachesCount} profesores asignados y ${subscriptionsCount} suscripciones registradas. Podés desactivarlo en su lugar.`
    );
    this.name = "PlatformPlanInUseError";
  }
}

export class PlatformPlanService {
  constructor(
    private readonly repo: PrismaPlatformPlanRepository = platformPlanRepository
  ) {}

  async list(includeInactive = false): Promise<PlatformPlanDTO[]> {
    return this.repo.findAll(includeInactive);
  }

  async getById(id: string): Promise<PlatformPlanDTO> {
    const plan = await this.repo.findById(id);
    if (!plan) throw new PlatformPlanNotFoundError(id);
    return plan;
  }

  async create(data: CreatePlatformPlanInput): Promise<PlatformPlanDTO> {
    const parsed = createPlatformPlanSchema.parse(data);
    const existing = await this.repo.findByName(parsed.name.trim());
    if (existing) {
      throw new PlatformPlanNameAlreadyExistsError(parsed.name.trim());
    }
    return this.repo.create(parsed);
  }

  async update(data: UpdatePlatformPlanInput): Promise<PlatformPlanDTO> {
    const parsed = updatePlatformPlanSchema.parse(data);
    const current = await this.repo.findById(parsed.id);
    if (!current) throw new PlatformPlanNotFoundError(parsed.id);

    if (parsed.name.trim().toLowerCase() !== current.name.toLowerCase()) {
      const existing = await this.repo.findByName(parsed.name.trim());
      if (existing && existing.id !== parsed.id) {
        throw new PlatformPlanNameAlreadyExistsError(parsed.name.trim());
      }
    }

    return this.repo.update(parsed.id, parsed);
  }

  async setGlobalTrialDays(trialDays: number): Promise<number> {
    if (trialDays < 0) {
      throw new Error("Los días de prueba no pueden ser negativos.");
    }
    return this.repo.setGlobalTrialDays(trialDays);
  }

  async toggleActive(id: string, isActive: boolean): Promise<PlatformPlanDTO> {
    const current = await this.repo.findById(id);
    if (!current) throw new PlatformPlanNotFoundError(id);
    return this.repo.update(id, { isActive });
  }

  async delete(id: string): Promise<void> {
    const current = await this.repo.findById(id);
    if (!current) throw new PlatformPlanNotFoundError(id);

    const { coachesCount, subscriptionsCount } = await this.repo.countUsage(id);
    if (coachesCount > 0 || subscriptionsCount > 0) {
      throw new PlatformPlanInUseError(coachesCount, subscriptionsCount);
    }

    await this.repo.delete(id);
  }
}

export const platformPlanService = new PlatformPlanService();
