import bcrypt from "bcryptjs"
import { beforeAll, describe, expect, it } from "vitest"
import { GenericProfileService } from "./generic-profile.service"
import type { GenericProfileWithTemplate, IGenericProfileRepository } from "@/lib/repositories/interfaces"

function makeProfile(level: "basico" | "intermedio" | "avanzado", passwordHash: string): GenericProfileWithTemplate {
  return {
    id: `id-${level}`,
    trainerId: "test-trainer-id",
    level: level as GenericProfileWithTemplate["level"],
    passwordHash,
    assignedTemplateId: null,
    assignedTemplate: null,
    updatedAt: new Date(),
  }
}

class FakeGenericProfileRepository implements IGenericProfileRepository {
  constructor(private profiles: GenericProfileWithTemplate[]) {}

  async findAll() {
    return this.profiles
  }

  async findByLevel(level: GenericProfileWithTemplate["level"]) {
    return this.profiles.find((p) => p.level === level) ?? null
  }

  async assignTemplate(level: GenericProfileWithTemplate["level"], templateId: string | null) {
    const profile = this.profiles.find((p) => p.level === level)
    if (!profile) throw new Error("not found")
    profile.assignedTemplateId = templateId
    return profile
  }

  async updatePasswordHash(level: GenericProfileWithTemplate["level"], passwordHash: string) {
    const profile = this.profiles.find((p) => p.level === level)
    if (!profile) throw new Error("not found")
    profile.passwordHash = passwordHash
  }
}

describe("GenericProfileService.verifyPassword", () => {
  let service: GenericProfileService

  beforeAll(async () => {
    const profiles = [
      makeProfile("basico", await bcrypt.hash("olympia.basico", 10)),
      makeProfile("intermedio", await bcrypt.hash("olympia.intermedio", 10)),
      makeProfile("avanzado", await bcrypt.hash("olympia.avanzado", 10)),
    ]
    service = new GenericProfileService(new FakeGenericProfileRepository(profiles))
  })

  it("returns the matching level for a correct password", async () => {
    await expect(service.verifyPassword("olympia.intermedio")).resolves.toBe("intermedio")
  })

  it("returns null for a wrong password", async () => {
    await expect(service.verifyPassword("wrong-password")).resolves.toBeNull()
  })

  it("returns null for an empty string", async () => {
    await expect(service.verifyPassword("")).resolves.toBeNull()
  })
})

describe("GenericProfileService.updatePassword", () => {
  it("hashes the new password before saving", async () => {
    const profiles = [makeProfile("basico", await bcrypt.hash("old-password", 10))]
    const repo = new FakeGenericProfileRepository(profiles)
    const service = new GenericProfileService(repo)

    await service.updatePassword("basico" as GenericProfileWithTemplate["level"], "new-password-123")

    const stored = await repo.findByLevel("basico" as GenericProfileWithTemplate["level"])
    expect(stored?.passwordHash).not.toBe("new-password-123")
    await expect(bcrypt.compare("new-password-123", stored!.passwordHash)).resolves.toBe(true)
  })
})
