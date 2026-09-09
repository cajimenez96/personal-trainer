import { db } from "@/lib/db"
import type { GenericLevel } from "@/app/generated/prisma/client"
import type { GenericProfileWithTemplate, IGenericProfileRepository } from "@/lib/repositories/interfaces"

const TEMPLATE_SELECT = { assignedTemplate: { select: { id: true, name: true } } } as const

export class PrismaGenericProfileRepository implements IGenericProfileRepository {
  findAll(): Promise<GenericProfileWithTemplate[]> {
    return db.genericProfile.findMany({
      include: TEMPLATE_SELECT,
      orderBy: { level: "asc" },
    })
  }

  findByLevel(level: GenericLevel): Promise<GenericProfileWithTemplate | null> {
    return db.genericProfile.findUnique({
      where: { level },
      include: TEMPLATE_SELECT,
    })
  }

  assignTemplate(level: GenericLevel, templateId: string | null): Promise<GenericProfileWithTemplate> {
    return db.genericProfile.update({
      where: { level },
      data: { assignedTemplateId: templateId },
      include: TEMPLATE_SELECT,
    })
  }

  async updatePasswordHash(level: GenericLevel, passwordHash: string): Promise<void> {
    await db.genericProfile.update({ where: { level }, data: { passwordHash } })
  }
}
