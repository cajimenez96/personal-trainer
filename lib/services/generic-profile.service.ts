import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import type { GenericLevel } from "@/app/generated/prisma/client"
import type {
  GenericProfileWithTemplate,
  IGenericProfileRepository,
} from "@/lib/repositories/interfaces"
import { PrismaGenericProfileRepository } from "@/lib/repositories/generic-profile.repository"

const SALT_ROUNDS = 10

export const DEFAULT_MAX_GENERIC_PROFILES = 3

export class GenericProfileLimitReachedError extends Error {
  constructor(max = DEFAULT_MAX_GENERIC_PROFILES) {
    super(
      `Límite de alumnos genéricos alcanzado: tu cuenta permite hasta ${max} alumnos genéricos. Contactá al administrador para ampliar tu cupo.`,
    )
    this.name = "GenericProfileLimitReachedError"
  }
}

export type TrainerGenericLimitsLookup = (
  trainerId: string,
) => Promise<{ maxGenericProfiles: number } | null>

export class GenericProfileService {
  constructor(
    private readonly repo: IGenericProfileRepository,
    private readonly limitsLookup?: TrainerGenericLimitsLookup,
  ) {}

  private async getMaxGenericProfiles(trainerId?: string): Promise<number> {
    if (!trainerId) return DEFAULT_MAX_GENERIC_PROFILES
    if (this.limitsLookup) {
      const res = await this.limitsLookup(trainerId)
      return res?.maxGenericProfiles ?? DEFAULT_MAX_GENERIC_PROFILES
    }
    try {
      const trainer = await db.trainer.findUnique({
        where: { id: trainerId },
        select: { maxGenericProfiles: true },
      })
      return trainer?.maxGenericProfiles ?? DEFAULT_MAX_GENERIC_PROFILES
    } catch {
      return DEFAULT_MAX_GENERIC_PROFILES
    }
  }

  getAll(trainerId?: string) {
    return this.repo.findAll(trainerId)
  }

  getById(id: string, trainerId?: string) {
    return this.repo.findById(id, trainerId)
  }

  getByLevel(level: GenericLevel, trainerId?: string) {
    return this.repo.findByLevel(level, trainerId)
  }

  async create(
    input: {
      name: string
      password: string
      templateId?: string | null
    },
    trainerId: string,
  ): Promise<GenericProfileWithTemplate> {
    const currentCount = await this.repo.count(trainerId)
    const max = await this.getMaxGenericProfiles(trainerId)
    if (currentCount >= max) {
      throw new GenericProfileLimitReachedError(max)
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)
    return this.repo.create({
      name: input.name.trim(),
      passwordHash,
      trainerId,
      assignedTemplateId: input.templateId ?? null,
    })
  }

  async update(
    id: string,
    input: {
      name?: string
      templateId?: string | null
      password?: string
    },
    trainerId: string,
  ): Promise<GenericProfileWithTemplate> {
    const data: {
      name?: string
      assignedTemplateId?: string | null
      passwordHash?: string
    } = {}

    if (input.name !== undefined) data.name = input.name.trim()
    if (input.templateId !== undefined) data.assignedTemplateId = input.templateId
    if (input.password) {
      data.passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)
    }

    return this.repo.update(id, data, trainerId)
  }

  delete(id: string, trainerId: string) {
    return this.repo.delete(id, trainerId)
  }

  assignTemplate(levelOrId: string, templateId: string | null, trainerId?: string) {
    return this.repo.assignTemplate(levelOrId, templateId, trainerId)
  }

  async updatePassword(levelOrId: string, plainPassword: string, trainerId?: string) {
    const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS)
    await this.repo.updatePasswordHash(levelOrId, passwordHash, trainerId)
  }

  // Compares the entered value against all profiles' hashes for the given trainer.
  async verifyPassword(
    candidate: string,
    trainerId?: string,
  ): Promise<GenericProfileWithTemplate | null> {
    if (!candidate) return null
    const profiles = await this.repo.findAll(trainerId)
    for (const profile of profiles) {
      const isMatch = await bcrypt.compare(candidate, profile.passwordHash)
      if (isMatch) return profile
    }
    return null
  }
}

export const genericProfileService = new GenericProfileService(
  new PrismaGenericProfileRepository(),
)
