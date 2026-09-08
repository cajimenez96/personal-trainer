import bcrypt from "bcryptjs"
import type { GenericLevel } from "@/app/generated/prisma/client"
import type { IGenericProfileRepository } from "@/lib/repositories/interfaces"
import { PrismaGenericProfileRepository } from "@/lib/repositories/generic-profile.repository"

const SALT_ROUNDS = 10

export class GenericProfileService {
  constructor(private readonly repo: IGenericProfileRepository) {}

  getAll() {
    return this.repo.findAll()
  }

  getByLevel(level: GenericLevel) {
    return this.repo.findByLevel(level)
  }

  assignTemplate(level: GenericLevel, templateId: string | null) {
    return this.repo.assignTemplate(level, templateId)
  }

  async updatePassword(level: GenericLevel, plainPassword: string) {
    const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS)
    await this.repo.updatePasswordHash(level, passwordHash)
  }

  // Compares the entered value against all 3 profiles' hashes. Cheap at this
  // scale (3 rows), and the only way to identify the level: the password is
  // coach-configurable free text, not a fixed pattern we could branch on.
  async verifyPassword(candidate: string): Promise<GenericLevel | null> {
    if (!candidate) return null
    const profiles = await this.repo.findAll()
    for (const profile of profiles) {
      const isMatch = await bcrypt.compare(candidate, profile.passwordHash)
      if (isMatch) return profile.level
    }
    return null
  }
}

export const genericProfileService = new GenericProfileService(new PrismaGenericProfileRepository())
