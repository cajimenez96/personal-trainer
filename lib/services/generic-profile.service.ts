import bcrypt from "bcryptjs"
import type { GenericLevel } from "@/app/generated/prisma/client"
import type { IGenericProfileRepository } from "@/lib/repositories/interfaces"
import { PrismaGenericProfileRepository } from "@/lib/repositories/generic-profile.repository"

const SALT_ROUNDS = 10

export class GenericProfileService {
  constructor(private readonly repo: IGenericProfileRepository) {}

  getAll(trainerId?: string) {
    return this.repo.findAll(trainerId)
  }

  getByLevel(level: GenericLevel, trainerId?: string) {
    return this.repo.findByLevel(level, trainerId)
  }

  assignTemplate(level: GenericLevel, templateId: string | null, trainerId?: string) {
    return this.repo.assignTemplate(level, templateId, trainerId)
  }

  async updatePassword(level: GenericLevel, plainPassword: string, trainerId?: string) {
    const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS)
    await this.repo.updatePasswordHash(level, passwordHash, trainerId)
  }

  // Compares the entered value against all 3 profiles' hashes for the given trainer.
  async verifyPassword(candidate: string, trainerId?: string): Promise<GenericLevel | null> {
    if (!candidate) return null
    const profiles = await this.repo.findAll(trainerId)
    for (const profile of profiles) {
      const isMatch = await bcrypt.compare(candidate, profile.passwordHash)
      if (isMatch) return profile.level
    }
    return null
  }
}

export const genericProfileService = new GenericProfileService(new PrismaGenericProfileRepository())

