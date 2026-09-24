import bcrypt from "bcryptjs"
import { beforeAll, describe, expect, it } from "vitest"
import {
  GenericProfileLimitReachedError,
  GenericProfileService,
} from "./generic-profile.service"
import type {
  CreateGenericProfileData,
  GenericProfileWithTemplate,
  IGenericProfileRepository,
  UpdateGenericProfileData,
} from "@/lib/repositories/interfaces"

function makeProfile(
  id: string,
  name: string,
  passwordHash: string,
  level?: "basico" | "intermedio" | "avanzado",
): GenericProfileWithTemplate {
  return {
    id,
    trainerId: "test-trainer-id",
    name,
    level: level as GenericProfileWithTemplate["level"],
    passwordHash,
    assignedTemplateId: null,
    assignedTemplate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

class FakeGenericProfileRepository implements IGenericProfileRepository {
  constructor(private profiles: GenericProfileWithTemplate[]) {}

  async findAll() {
    return this.profiles
  }

  async findById(id: string) {
    return this.profiles.find((p) => p.id === id) ?? null
  }

  async findByLevel(level: GenericProfileWithTemplate["level"]) {
    return this.profiles.find((p) => p.level === level) ?? null
  }

  async create(data: CreateGenericProfileData) {
    const profile: GenericProfileWithTemplate = {
      id: `id-${Date.now()}`,
      trainerId: data.trainerId,
      name: data.name,
      passwordHash: data.passwordHash,
      assignedTemplateId: data.assignedTemplateId ?? null,
      assignedTemplate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.profiles.push(profile)
    return profile
  }

  async update(id: string, data: UpdateGenericProfileData) {
    const profile = this.profiles.find((p) => p.id === id)
    if (!profile) throw new Error("not found")
    if (data.name !== undefined) profile.name = data.name
    if (data.passwordHash !== undefined) profile.passwordHash = data.passwordHash
    if (data.assignedTemplateId !== undefined) profile.assignedTemplateId = data.assignedTemplateId
    return profile
  }

  async delete(id: string) {
    this.profiles = this.profiles.filter((p) => p.id !== id)
  }

  async count() {
    return this.profiles.length
  }

  async assignTemplate(levelOrId: string, templateId: string | null) {
    const profile = this.profiles.find((p) => p.id === levelOrId || p.level === levelOrId)
    if (!profile) throw new Error("not found")
    profile.assignedTemplateId = templateId
    return profile
  }

  async updatePasswordHash(levelOrId: string, passwordHash: string) {
    const profile = this.profiles.find((p) => p.id === levelOrId || p.level === levelOrId)
    if (!profile) throw new Error("not found")
    profile.passwordHash = passwordHash
  }
}

describe("GenericProfileService.verifyPassword", () => {
  let service: GenericProfileService

  beforeAll(async () => {
    const profiles = [
      makeProfile("id-basico", "Básico", await bcrypt.hash("olympia.basico", 10), "basico"),
      makeProfile("id-intermedio", "Intermedio", await bcrypt.hash("olympia.intermedio", 10), "intermedio"),
      makeProfile("id-avanzado", "Avanzado", await bcrypt.hash("olympia.avanzado", 10), "avanzado"),
    ]
    service = new GenericProfileService(new FakeGenericProfileRepository(profiles))
  })

  it("returns the matching profile for a correct password", async () => {
    const result = await service.verifyPassword("olympia.intermedio")
    expect(result).not.toBeNull()
    expect(result?.name).toBe("Intermedio")
    expect(result?.id).toBe("id-intermedio")
  })

  it("returns null for a wrong password", async () => {
    await expect(service.verifyPassword("wrong-password")).resolves.toBeNull()
  })

  it("returns null for an empty string", async () => {
    await expect(service.verifyPassword("")).resolves.toBeNull()
  })
})

describe("GenericProfileService.create with quota enforcement", () => {
  it("creates a generic profile when under quota", async () => {
    const repo = new FakeGenericProfileRepository([])
    const service = new GenericProfileService(repo, async () => ({ maxGenericProfiles: 2 }))

    const created = await service.create(
      { name: "Turno Mañana", password: "password123" },
      "test-trainer-id",
    )

    expect(created.name).toBe("Turno Mañana")
    expect(await repo.count()).toBe(1)
  })

  it("throws GenericProfileLimitReachedError when quota is reached", async () => {
    const existing = [
      makeProfile("id-1", "Grupo 1", "hash1"),
      makeProfile("id-2", "Grupo 2", "hash2"),
    ]
    const repo = new FakeGenericProfileRepository(existing)
    const service = new GenericProfileService(repo, async () => ({ maxGenericProfiles: 2 }))

    await expect(
      service.create({ name: "Grupo 3", password: "password123" }, "test-trainer-id"),
    ).rejects.toThrow(GenericProfileLimitReachedError)
  })
})

describe("GenericProfileService.update and delete", () => {
  it("updates and deletes profiles correctly", async () => {
    const existing = [makeProfile("id-1", "Inicial", "oldhash")]
    const repo = new FakeGenericProfileRepository(existing)
    const service = new GenericProfileService(repo)

    await service.update("id-1", { name: "Renombrado" }, "test-trainer-id")
    const updated = await repo.findById("id-1")
    expect(updated?.name).toBe("Renombrado")

    await service.delete("id-1", "test-trainer-id")
    expect(await repo.count()).toBe(0)
  })

  it("assigns template by profile id", async () => {
    const existing = [makeProfile("uuid-1234", "Inicial", "hash")]
    const repo = new FakeGenericProfileRepository(existing)
    const service = new GenericProfileService(repo)

    await service.assignTemplate("uuid-1234", "template-uuid")
    const profile = await repo.findById("uuid-1234")
    expect(profile?.assignedTemplateId).toBe("template-uuid")
  })
})
