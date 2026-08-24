import { db } from "@/lib/db"
import type { CreateLabelOptionData, ILabelOptionRepository, LabelOption } from "@/lib/repositories/interfaces"

export class PrismaModalidadRepository implements ILabelOptionRepository {
  findMany(): Promise<LabelOption[]> {
    return db.modalidad.findMany({ orderBy: { label: "asc" } })
  }

  findById(id: string) {
    return db.modalidad.findUnique({ where: { id } })
  }

  findByLabel(label: string) {
    return db.modalidad.findUnique({ where: { label } })
  }

  create(data: CreateLabelOptionData) {
    return db.modalidad.create({ data })
  }

  rename(id: string, label: string) {
    return db.modalidad.update({ where: { id }, data: { label } })
  }

  async delete(id: string) {
    await db.modalidad.delete({ where: { id } })
  }

  countStudentsUsing(id: string) {
    return db.student.count({ where: { modalidadId: id } })
  }
}
