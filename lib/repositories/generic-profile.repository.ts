import { db } from "@/lib/db"
import { getDefaultTrainerId } from "@/lib/tenant"
import type { GenericLevel } from "@/app/generated/prisma/client"
import type { GenericProfileWithTemplate, IGenericProfileRepository } from "@/lib/repositories/interfaces"

const TEMPLATE_SELECT = { assignedTemplate: { select: { id: true, name: true } } } as const

export class PrismaGenericProfileRepository implements IGenericProfileRepository {
  async findAll(trainerId?: string): Promise<GenericProfileWithTemplate[]> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    return db.genericProfile.findMany({
      where: { trainerId: effectiveTrainerId },
      include: TEMPLATE_SELECT,
      orderBy: { level: "asc" },
    })
  }

  async findByLevel(level: GenericLevel, trainerId?: string): Promise<GenericProfileWithTemplate | null> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    return db.genericProfile.findUnique({
      where: {
        unique_generic_level_per_trainer: {
          trainerId: effectiveTrainerId,
          level,
        },
      },
      include: TEMPLATE_SELECT,
    })
  }

  async assignTemplate(level: GenericLevel, templateId: string | null, trainerId?: string): Promise<GenericProfileWithTemplate> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    return db.genericProfile.update({
      where: {
        unique_generic_level_per_trainer: {
          trainerId: effectiveTrainerId,
          level,
        },
      },
      data: { assignedTemplateId: templateId },
      include: TEMPLATE_SELECT,
    })
  }

  async updatePasswordHash(level: GenericLevel, passwordHash: string, trainerId?: string): Promise<void> {
    const effectiveTrainerId = trainerId ?? (await getDefaultTrainerId())
    await db.genericProfile.update({
      where: {
        unique_generic_level_per_trainer: {
          trainerId: effectiveTrainerId,
          level,
        },
      },
      data: { passwordHash },
    })
  }
}

