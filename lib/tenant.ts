import { db } from "@/lib/db"

let cachedDefaultTrainerId: string | null = null

export async function getDefaultTrainerId(): Promise<string> {
  if (cachedDefaultTrainerId) return cachedDefaultTrainerId

  const trainer = await db.trainer.findFirst({
    where: { role: "COACH", isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })

  if (!trainer) {
    const anyTrainer = await db.trainer.findFirst({
      select: { id: true },
    })
    if (!anyTrainer) {
      throw new Error("No trainer found in database.")
    }
    cachedDefaultTrainerId = anyTrainer.id
    return anyTrainer.id
  }

  cachedDefaultTrainerId = trainer.id
  return trainer.id
}

export async function getTrainerBySlug(slug: string) {
  return db.trainer.findUnique({
    where: { slug },
  })
}
