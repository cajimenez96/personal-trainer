import { db } from "@/lib/db"
import type {
  CreateExerciseBlockData,
  CreateRoutineTemplateData,
  CreateTrainingDayData,
  IRoutineTemplateRepository,
  RoutineTemplateWithFullDays,
} from "@/lib/repositories/interfaces"

// HU-38: se intentó borrar un día/ejercicio que tiene historial real
// (progreso registrado por un alumno) o una personalización activa.
export class TemplateBlockInUseError extends Error {
  constructor(
    public readonly progressCount: number,
    public readonly overrideCount: number,
  ) {
    super(
      `No se puede eliminar: ${progressCount} registro(s) de progreso y ${overrideCount} personalización(es) todavía referencian ejercicios que se están quitando de la plantilla.`,
    )
    this.name = "TemplateBlockInUseError"
  }
}

function toBlockData(block: CreateExerciseBlockData, blockOrder: number) {
  return {
    exerciseId: block.exerciseId,
    sets: block.sets,
    reps: block.reps ?? null,
    repsScheme: block.repsScheme ?? null,
    weightKg: block.weightKg ?? null,
    intensity: block.intensity ?? null,
    tempo: block.tempo ?? null,
    durationSecs: block.durationSecs ?? null,
    restSecs: block.restSecs ?? null,
    trainerNotes: block.trainerNotes ?? null,
    blockOrder,
    groupLabel: block.groupLabel ?? null,
    groupRestSecs: block.groupRestSecs ?? null,
  }
}

const listInclude = {
  trainingDays: {
    orderBy: { dayOrder: "asc" as const },
    include: { exerciseBlocks: { select: { id: true } } },
  },
}

const fullInclude = {
  trainingDays: {
    orderBy: { dayOrder: "asc" as const },
    include: { exerciseBlocks: { orderBy: { blockOrder: "asc" as const } } },
  },
}

function toNestedDaysCreate(days: CreateTrainingDayData[]) {
  return days.map((day, dayIndex) => ({
    label: day.label,
    dayOrder: dayIndex + 1,
    exerciseBlocks: {
      create: day.blocks.map((block, blockIndex) => toBlockData(block, blockIndex + 1)),
    },
  }))
}

export class PrismaRoutineTemplateRepository implements IRoutineTemplateRepository {
  create(data: CreateRoutineTemplateData) {
    return db.routineTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        durationWeeks: data.durationWeeks,
        trainingDays: { create: toNestedDaysCreate(data.days) },
      },
      include: listInclude,
    })
  }

  findMany() {
    return db.routineTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: listInclude,
    })
  }

  async findById(id: string): Promise<RoutineTemplateWithFullDays | null> {
    const template = await db.routineTemplate.findUnique({ where: { id }, include: fullInclude })
    if (!template) return null

    return {
      ...template,
      trainingDays: template.trainingDays.map((day) => ({
        ...day,
        exerciseBlocks: day.exerciseBlocks.map((block) => ({
          ...block,
          weightKg: block.weightKg ? block.weightKg.toNumber() : null,
        })),
      })),
    }
  }

  // HU-38: reemplazo completo por diff — antes esto hacía deleteMany + create
  // de TODOS los días/bloques en cada edición, lo que rompía cualquier
  // progress_log u override que referenciara un bloque sin cambios (nueva
  // fila = nuevo id, aunque el contenido fuera idéntico). Ahora solo se
  // crean/eliminan los días y bloques que realmente cambiaron; los que se
  // mantienen se actualizan in-place preservando su id.
  update(id: string, data: CreateRoutineTemplateData) {
    return db.$transaction(async (tx) => {
      const existingDays = await tx.trainingDay.findMany({
        where: { templateId: id },
        include: { exerciseBlocks: { select: { id: true } } },
      })

      const incomingDayIds = new Set(data.days.map((d) => d.id).filter((v): v is string => !!v))
      const daysToRemove = existingDays.filter((d) => !incomingDayIds.has(d.id))

      const incomingBlockIdsByDay = new Map(
        data.days
          .filter((d): d is CreateTrainingDayData & { id: string } => !!d.id)
          .map((d) => [d.id, new Set(d.blocks.map((b) => b.id).filter((v): v is string => !!v))]),
      )

      const blocksToRemove: string[] = []
      for (const day of existingDays) {
        if (daysToRemove.some((d) => d.id === day.id)) {
          blocksToRemove.push(...day.exerciseBlocks.map((b) => b.id))
          continue
        }
        const keepIds = incomingBlockIdsByDay.get(day.id) ?? new Set<string>()
        for (const block of day.exerciseBlocks) {
          if (!keepIds.has(block.id)) blocksToRemove.push(block.id)
        }
      }

      if (blocksToRemove.length > 0) {
        const [progressCount, overrideCount] = await Promise.all([
          tx.progressLog.count({ where: { exerciseBlockId: { in: blocksToRemove } } }),
          tx.routineOverride.count({ where: { exerciseBlockId: { in: blocksToRemove } } }),
        ])
        if (progressCount > 0 || overrideCount > 0) {
          throw new TemplateBlockInUseError(progressCount, overrideCount)
        }
      }

      if (blocksToRemove.length > 0) {
        await tx.exerciseBlock.deleteMany({ where: { id: { in: blocksToRemove } } })
      }
      if (daysToRemove.length > 0) {
        await tx.trainingDay.deleteMany({ where: { id: { in: daysToRemove.map((d) => d.id) } } })
      }

      for (const [dayIndex, day] of data.days.entries()) {
        const dayRecord = day.id
          ? await tx.trainingDay.update({
              where: { id: day.id },
              data: { label: day.label, dayOrder: dayIndex + 1 },
            })
          : await tx.trainingDay.create({
              data: { templateId: id, label: day.label, dayOrder: dayIndex + 1 },
            })

        for (const [blockIndex, block] of day.blocks.entries()) {
          const blockData = toBlockData(block, blockIndex + 1)
          if (block.id) {
            await tx.exerciseBlock.update({ where: { id: block.id }, data: blockData })
          } else {
            await tx.exerciseBlock.create({
              data: { ...blockData, trainingDayId: dayRecord.id },
            })
          }
        }
      }

      await tx.routineTemplate.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          durationWeeks: data.durationWeeks,
        },
      })

      return tx.routineTemplate.findUniqueOrThrow({ where: { id }, include: listInclude })
    })
  }

  async duplicate(id: string) {
    const source = await db.routineTemplate.findUniqueOrThrow({
      where: { id },
      include: fullInclude,
    })

    const days: CreateTrainingDayData[] = source.trainingDays.map((day) => ({
      label: day.label,
      blocks: day.exerciseBlocks.map((block) => ({
        exerciseId: block.exerciseId,
        sets: block.sets,
        reps: block.reps,
        repsScheme: block.repsScheme,
        weightKg: block.weightKg ? block.weightKg.toNumber() : null,
        intensity: block.intensity,
        tempo: block.tempo,
        durationSecs: block.durationSecs,
        restSecs: block.restSecs,
        trainerNotes: block.trainerNotes,
        groupLabel: block.groupLabel,
        groupRestSecs: block.groupRestSecs,
      })),
    }))

    return db.routineTemplate.create({
      data: {
        name: `Copia de ${source.name}`,
        description: source.description,
        durationWeeks: source.durationWeeks,
        trainingDays: { create: toNestedDaysCreate(days) },
      },
      include: listInclude,
    })
  }

  countAssignments(id: string) {
    return db.assignedRoutine.count({ where: { templateId: id } })
  }
}
