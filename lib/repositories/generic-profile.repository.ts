import { db } from "@/lib/db"
import { getDefaultTrainerId } from "@/lib/tenant"
import type { GenericLevel } from "@/app/generated/prisma/client"
import type {
  CreateGenericProfileData,
  GenericProfileWithTemplate,
  IGenericProfileRepository,
  UpdateGenericProfileData,
} from "@/lib/repositories/interfaces"

const TEMPLATE_SELECT = { assignedTemplate: { select: { id: true, name: true } } } as const

const GENERIC_LEVEL_SET = new Set(["basico", "intermedio", "avanzado"])

function isGenericLevel(value: string): value is GenericLevel {
  return GENERIC_LEVEL_SET.has(value)
}

export class PrismaGenericProfileRepository implements IGenericProfileRepository {
  async findAll(trainerId?: string): Promise<GenericProfileWithTemplate[]> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    return db.genericProfile.findMany({
      where: { trainerId: effectiveTrainerId },
      include: TEMPLATE_SELECT,
      orderBy: { createdAt: "asc" },
    })
  }

  async findById(id: string, trainerId?: string): Promise<GenericProfileWithTemplate | null> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    return db.genericProfile.findFirst({
      where: { id, trainerId: effectiveTrainerId },
      include: TEMPLATE_SELECT,
    })
  }

  async findByLevel(level: GenericLevel, trainerId?: string): Promise<GenericProfileWithTemplate | null> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    return db.genericProfile.findFirst({
      where: {
        trainerId: effectiveTrainerId,
        level,
      },
      include: TEMPLATE_SELECT,
    })
  }

  async create(data: CreateGenericProfileData): Promise<GenericProfileWithTemplate> {
    return db.genericProfile.create({
      data: {
        name: data.name,
        passwordHash: data.passwordHash,
        trainerId: data.trainerId,
        assignedTemplateId: data.assignedTemplateId ?? null,
      },
      include: TEMPLATE_SELECT,
    })
  }

  async update(
    id: string,
    data: UpdateGenericProfileData,
    trainerId?: string,
  ): Promise<GenericProfileWithTemplate> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    return db.genericProfile.update({
      where: { id, trainerId: effectiveTrainerId },
      data,
      include: TEMPLATE_SELECT,
    })
  }

  async delete(id: string, trainerId?: string): Promise<void> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    await db.genericProfile.delete({
      where: { id, trainerId: effectiveTrainerId },
    })
  }

  async count(trainerId?: string): Promise<number> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    return db.genericProfile.count({
      where: { trainerId: effectiveTrainerId },
    })
  }

  async assignTemplate(
    levelOrId: string,
    templateId: string | null,
    trainerId?: string,
  ): Promise<GenericProfileWithTemplate> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    const existing = await db.genericProfile.findFirst({
      where: {
        trainerId: effectiveTrainerId,
        ...(isGenericLevel(levelOrId)
          ? { OR: [{ id: levelOrId }, { level: levelOrId }] }
          : { id: levelOrId }),
      },
    })
    if (!existing) {
      throw new Error(`Perfil genérico no encontrado para '${levelOrId}'`)
    }

    return db.genericProfile.update({
      where: { id: existing.id },
      data: { assignedTemplateId: templateId },
      include: TEMPLATE_SELECT,
    })
  }

  async updatePasswordHash(
    levelOrId: string,
    passwordHash: string,
    trainerId?: string,
  ): Promise<void> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    const existing = await db.genericProfile.findFirst({
      where: {
        trainerId: effectiveTrainerId,
        ...(isGenericLevel(levelOrId)
          ? { OR: [{ id: levelOrId }, { level: levelOrId }] }
          : { id: levelOrId }),
      },
    })
    if (!existing) {
      throw new Error(`Perfil genérico no encontrado para '${levelOrId}'`)
    }

    await db.genericProfile.update({
      where: { id: existing.id },
      data: { passwordHash },
    })
  }
}

