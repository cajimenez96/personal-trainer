import type {
  AssignedRoutineRaw,
  AssignRoutineData,
  IAssignedRoutineRepository,
} from "@/lib/repositories/interfaces"
import { PrismaAssignedRoutineRepository } from "@/lib/repositories/assigned-routine.repository"

export type RoutineDetailBlock = {
  id: string
  exerciseName: string
  exerciseVideoUrl: string | null
  sets: number
  reps: number | null
  durationSecs: number | null
  restSecs: number | null
  trainerNotes: string | null
  isOverridden: boolean
}

export type RoutineDetailDay = {
  id: string
  label: string
  blocks: RoutineDetailBlock[]
}

export type RoutineDetail = {
  id: string
  studentId: string
  status: string
  assignedAt: Date
  expiresAt: Date | null
  templateName: string
  days: RoutineDetailDay[]
}

// Merges each exercise block with its per-assignment override (if any) — the
// override's null fields mean "use the template's base value" (RN-02: the
// override never mutates the template itself).
function mergeRoutineDetail(raw: AssignedRoutineRaw): RoutineDetail {
  const overrideByBlock = new Map(raw.overrides.map((o) => [o.exerciseBlockId, o]))

  return {
    id: raw.id,
    studentId: raw.studentId,
    status: raw.status,
    assignedAt: raw.assignedAt,
    expiresAt: raw.expiresAt,
    templateName: raw.template.name,
    days: raw.template.trainingDays.map((day) => ({
      id: day.id,
      label: day.label,
      blocks: day.exerciseBlocks.map((block) => {
        const override = overrideByBlock.get(block.id)
        return {
          id: block.id,
          exerciseName: block.exercise.name,
          exerciseVideoUrl: block.exercise.videoUrl,
          sets: override?.sets ?? block.sets,
          reps: override?.reps ?? block.reps,
          durationSecs: override?.durationSecs ?? block.durationSecs,
          restSecs: override?.restSecs ?? block.restSecs,
          trainerNotes: override?.trainerNotes ?? block.trainerNotes,
          isOverridden: !!override,
        }
      }),
    })),
  }
}

export class AssignedRoutineService {
  constructor(private readonly assignedRoutineRepo: IAssignedRoutineRepository) {}

  assign(data: AssignRoutineData) {
    return this.assignedRoutineRepo.assign(data)
  }

  getActiveByStudentId(studentId: string) {
    return this.assignedRoutineRepo.findActiveByStudentId(studentId)
  }

  getHistoryByStudentId(studentId: string) {
    return this.assignedRoutineRepo.findHistoryByStudentId(studentId)
  }

  async getDetail(id: string): Promise<RoutineDetail | null> {
    const raw = await this.assignedRoutineRepo.findByIdWithDetails(id)
    return raw ? mergeRoutineDetail(raw) : null
  }

  countActive() {
    return this.assignedRoutineRepo.countActive()
  }
}

export const assignedRoutineService = new AssignedRoutineService(
  new PrismaAssignedRoutineRepository(),
)
