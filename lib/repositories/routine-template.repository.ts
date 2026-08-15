import { db } from "@/lib/db"
import type {
  CreateRoutineTemplateData,
  CreateTrainingDayData,
  IRoutineTemplateRepository,
} from "@/lib/repositories/interfaces"

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
      create: day.blocks.map((block, blockIndex) => ({
        exerciseId: block.exerciseId,
        sets: block.sets,
        reps: block.reps ?? null,
        durationSecs: block.durationSecs ?? null,
        restSecs: block.restSecs ?? null,
        trainerNotes: block.trainerNotes ?? null,
        blockOrder: blockIndex + 1,
      })),
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

  findById(id: string) {
    return db.routineTemplate.findUnique({ where: { id }, include: fullInclude })
  }

  update(id: string, data: CreateRoutineTemplateData) {
    return db.routineTemplate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        durationWeeks: data.durationWeeks,
        trainingDays: {
          deleteMany: {},
          create: toNestedDaysCreate(data.days),
        },
      },
      include: listInclude,
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
        durationSecs: block.durationSecs,
        restSecs: block.restSecs,
        trainerNotes: block.trainerNotes,
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
