import { db } from "@/lib/db"
import type { CreateLabelOptionData, ILabelOptionRepository, LabelOption } from "@/lib/repositories/interfaces"

export class PrismaObjetivoRepository implements ILabelOptionRepository {
  findMany(): Promise<LabelOption[]> {
    return db.objetivo.findMany({ orderBy: { label: "asc" } })
  }

  findById(id: string) {
    return db.objetivo.findUnique({ where: { id } })
  }

  findByLabel(label: string) {
    return db.objetivo.findUnique({ where: { label } })
  }

  create(data: CreateLabelOptionData) {
    return db.objetivo.create({ data })
  }

  rename(id: string, label: string) {
    return db.objetivo.update({ where: { id }, data: { label } })
  }

  async delete(id: string) {
    await db.objetivo.delete({ where: { id } })
  }

  countStudentsUsing(id: string) {
    return db.student.count({ where: { objetivoId: id } })
  }
}
