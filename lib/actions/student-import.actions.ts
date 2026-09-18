"use server"

import { z } from "zod"
import { db } from "@/lib/db"
import { requireCoachAuth } from "@/lib/auth"
import { DniAlreadyExistsError, studentService } from "@/lib/services/student.service"
import { createStudentSchema, type CreateStudentInput } from "@/lib/validators/student"
import { objetivoService } from "@/lib/services/objetivo.service"
import { modalidadService } from "@/lib/services/modalidad.service"

// Objetivo/modalidad son listas cerradas administradas por el trainer (ver
// dashboard) — el CSV las referencia por su texto (label) actual, no por id
// (nadie quiere tipear UUIDs a mano en una planilla), así que el importador
// necesita esto para resolver "Hipertrofia" -> el id real antes de crear.
export async function getStudentImportRefsAction() {
  await requireCoachAuth()
  const [objetivos, modalidades] = await Promise.all([
    objetivoService.list(),
    modalidadService.list(),
  ])
  return { objetivos, modalidades }
}

// Checks which of the given DNIs already exist in the DB for this trainer
export async function checkExistingDnisAction(dnis: string[]): Promise<string[]> {
  const user = await requireCoachAuth()
  const parsed = z.array(z.string()).max(500).parse(dnis)
  if (parsed.length === 0) return []

  const existing = await db.student.findMany({
    where: { trainerId: user.id, dni: { in: parsed } },
    select: { dni: true },
  })

  return existing.map((s) => s.dni)
}

export type ImportStudentsChunkResult = {
  succeeded: string[]
  failed: { dni: string; error: string }[]
}

const chunkSchema = z.array(createStudentSchema).min(1).max(50)

export async function importStudentsChunkAction(
  rows: CreateStudentInput[],
): Promise<ImportStudentsChunkResult> {
  const user = await requireCoachAuth()
  const parsed = chunkSchema.parse(rows)

  const succeeded: string[] = []
  const failed: { dni: string; error: string }[] = []

  for (const row of parsed) {
    try {
      await studentService.create({ ...row, trainerId: user.id })
      succeeded.push(row.dni)
    } catch (err) {
      failed.push({
        dni: row.dni,
        error: err instanceof DniAlreadyExistsError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Error desconocido",
      })
    }
  }

  return { succeeded, failed }
}

