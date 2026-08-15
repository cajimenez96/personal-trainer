import type {
  AssignedRoutine,
  Exercise,
  Modalidad,
  Nivel,
  Objetivo,
  RoutineTemplate,
  Student,
} from "@/app/generated/prisma/client"

export interface CreateStudentData {
  firstName: string
  lastName: string
  dni: string
  email?: string
  phone?: string
  objetivo?: Objetivo
  nivel?: Nivel
  modalidad?: Modalidad
  membershipStartsAt?: Date
  paymentExpiresAt?: Date
  healthNotes?: string
}

export interface UpdateStudentData {
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  objetivo: Objetivo | null
  nivel: Nivel | null
  modalidad: Modalidad | null
  membershipStartsAt: Date | null
  paymentExpiresAt: Date | null
  healthNotes: string | null
}

export interface StudentFilters {
  search?: string
  objetivo?: Objetivo
  nivel?: Nivel
  modalidad?: Modalidad
  isActive?: boolean
}

export interface StudentListParams extends StudentFilters {
  cursor?: string
  limit: number
}

export interface StudentListResult {
  items: Student[]
  nextCursor: string | null
}

export interface IStudentRepository {
  findMany(params: StudentListParams): Promise<StudentListResult>
  findById(id: string): Promise<Student | null>
  findByDni(dni: string): Promise<Student | null>
  create(data: CreateStudentData): Promise<Student>
  update(id: string, data: UpdateStudentData): Promise<Student>
  deactivate(id: string): Promise<Student>
  reactivate(id: string): Promise<Student>
  findAllActive(filters: StudentFilters): Promise<Student[]>
  countActive(): Promise<number>
  countExpiringSoon(before: Date): Promise<number>
}

export interface ExerciseFilters {
  search?: string
  muscleGroup?: string
}

export interface CreateExerciseData {
  name: string
  primaryMuscle: string
  secondaryMuscle?: string
  videoUrl?: string
}

export interface UpdateExerciseData {
  name: string
  primaryMuscle: string
  secondaryMuscle: string | null
  videoUrl: string | null
}

export interface IExerciseRepository {
  findMany(filters: ExerciseFilters): Promise<Exercise[]>
  findById(id: string): Promise<Exercise | null>
  findByName(name: string): Promise<Exercise | null>
  listMuscleGroups(): Promise<string[]>
  create(data: CreateExerciseData): Promise<Exercise>
  update(id: string, data: UpdateExerciseData): Promise<Exercise>
  delete(id: string): Promise<void>
  countBlocksUsing(id: string): Promise<number>
}

export interface CreateExerciseBlockData {
  exerciseId: string
  sets: number
  reps?: number | null
  durationSecs?: number | null
  restSecs?: number | null
  trainerNotes?: string | null
}

export interface CreateTrainingDayData {
  label: string
  blocks: CreateExerciseBlockData[]
}

export interface CreateRoutineTemplateData {
  name: string
  description?: string
  durationWeeks: number
  days: CreateTrainingDayData[]
}

export type RoutineTemplateWithDays = RoutineTemplate & {
  trainingDays: {
    id: string
    label: string
    dayOrder: number
    exerciseBlocks: { id: string }[]
  }[]
}

export type RoutineTemplateWithFullDays = RoutineTemplate & {
  trainingDays: {
    id: string
    label: string
    dayOrder: number
    exerciseBlocks: {
      id: string
      exerciseId: string
      sets: number
      reps: number | null
      durationSecs: number | null
      restSecs: number | null
      trainerNotes: string | null
      blockOrder: number
    }[]
  }[]
}

export interface IRoutineTemplateRepository {
  create(data: CreateRoutineTemplateData): Promise<RoutineTemplateWithDays>
  findMany(): Promise<RoutineTemplateWithDays[]>
  findById(id: string): Promise<RoutineTemplateWithFullDays | null>
  update(id: string, data: CreateRoutineTemplateData): Promise<RoutineTemplateWithDays>
  duplicate(id: string): Promise<RoutineTemplateWithDays>
  countAssignments(id: string): Promise<number>
}

export interface AssignOverrideData {
  exerciseBlockId: string
  sets?: number | null
  reps?: number | null
  durationSecs?: number | null
  restSecs?: number | null
  trainerNotes?: string | null
}

export interface AssignRoutineData {
  studentId: string
  templateId: string
  overrides: AssignOverrideData[]
}

export type AssignedRoutineWithTemplate = AssignedRoutine & {
  template: { name: string }
}

export type AssignedRoutineRaw = AssignedRoutine & {
  template: {
    name: string
    trainingDays: {
      id: string
      label: string
      dayOrder: number
      exerciseBlocks: {
        id: string
        sets: number
        reps: number | null
        durationSecs: number | null
        restSecs: number | null
        trainerNotes: string | null
        blockOrder: number
        exercise: { name: string; videoUrl: string | null }
      }[]
    }[]
  }
  overrides: {
    exerciseBlockId: string
    sets: number | null
    reps: number | null
    durationSecs: number | null
    restSecs: number | null
    trainerNotes: string | null
  }[]
}

export interface IAssignedRoutineRepository {
  assign(data: AssignRoutineData): Promise<AssignedRoutine>
  findActiveByStudentId(studentId: string): Promise<AssignedRoutineWithTemplate | null>
  findHistoryByStudentId(studentId: string): Promise<AssignedRoutineWithTemplate[]>
  findByIdWithDetails(id: string): Promise<AssignedRoutineRaw | null>
  countActive(): Promise<number>
}

export interface UpsertProgressLogData {
  studentId: string
  assignedRoutineId: string
  exerciseBlockId: string
  loggedDate: Date
  completed?: boolean
  weightKg?: number | null
  studentNotes?: string | null
}

export type ProgressLogEntry = {
  exerciseBlockId: string
  completed: boolean
  weightKg: number | null
  studentNotes: string | null
}

export type ProgressHistoryEntry = {
  loggedDate: Date
  exerciseBlockId: string
  exerciseName: string
  completed: boolean
  weightKg: number | null
  studentNotes: string | null
}

export interface ProgressHistoryFilters {
  from?: Date
  to?: Date
}

export interface IProgressLogRepository {
  upsert(data: UpsertProgressLogData): Promise<void>
  findForDay(studentId: string, loggedDate: Date): Promise<ProgressLogEntry[]>
  findByStudent(
    studentId: string,
    filters: ProgressHistoryFilters,
  ): Promise<ProgressHistoryEntry[]>
}
