import type {
  AssignedRoutine,
  Exercise,
  GenericLevel,
  Nivel,
  NoteType,
  RoutineTemplate,
  Student,
} from "@/app/generated/prisma/client"

export interface CreateStudentData {
  firstName: string
  lastName: string
  dni: string
  email?: string
  phone?: string
  objetivoId?: string
  secondaryGoals?: string
  nivel?: Nivel
  modalidadId?: string
  membershipStartsAt?: Date
  paymentExpiresAt?: Date
  healthNotes?: string
}

export interface UpdateStudentData {
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  objetivoId: string | null
  secondaryGoals: string | null
  nivel: Nivel | null
  modalidadId: string | null
  membershipStartsAt: Date | null
  paymentExpiresAt: Date | null
  healthNotes: string | null
}

export interface StudentFilters {
  search?: string
  objetivoId?: string
  nivel?: Nivel
  modalidadId?: string
  isActive?: boolean
  // Cuota vencida a la fecha actual — distinto de "sin fecha registrada"
  // (paymentExpiresAt null nunca cuenta como vencida).
  paymentExpired?: boolean
}

// HU-40: listas administrables por el trainer (no hardcodeadas) — Objetivo y
// Modalidad dejaron de ser enums de Postgres para ser tablas simples de
// lookup (id + label), con protección de borrado si algún alumno las usa.
export type LabelOption = {
  id: string
  label: string
}

export interface CreateLabelOptionData {
  label: string
}

export interface ILabelOptionRepository {
  findMany(): Promise<LabelOption[]>
  findById(id: string): Promise<LabelOption | null>
  findByLabel(label: string): Promise<LabelOption | null>
  create(data: CreateLabelOptionData): Promise<LabelOption>
  rename(id: string, label: string): Promise<LabelOption>
  delete(id: string): Promise<void>
  countStudentsUsing(id: string): Promise<number>
}

export interface StudentListParams extends StudentFilters {
  cursor?: string
  limit: number
}

export type StudentWithTaxonomies = Student & {
  objetivoRef: LabelOption | null
  modalidadRef: LabelOption | null
}

export interface StudentListResult {
  items: StudentWithTaxonomies[]
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
  // Presente = actualizar este bloque existente (preserva su id, y por lo
  // tanto cualquier progress_log/override que lo referencie). Ausente = crear
  // un bloque nuevo. Ver HU-38: update() ya no destruye y recrea todo.
  id?: string
  exerciseId: string
  sets: number
  reps?: number | null
  repsScheme?: string | null
  weightKg?: number | null
  intensity?: string | null
  tempo?: string | null
  durationSecs?: number | null
  restSecs?: number | null
  trainerNotes?: string | null
  groupLabel?: string | null
  groupRestSecs?: number | null
}

export interface CreateTrainingDayData {
  id?: string
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
      repsScheme: string | null
      weightKg: number | null
      intensity: string | null
      tempo: string | null
      durationSecs: number | null
      restSecs: number | null
      trainerNotes: string | null
      blockOrder: number
      groupLabel: string | null
      groupRestSecs: number | null
    }[]
  }[]
}

export interface IRoutineTemplateRepository {
  create(data: CreateRoutineTemplateData): Promise<RoutineTemplateWithDays>
  findMany(): Promise<RoutineTemplateWithDays[]>
  findById(id: string): Promise<RoutineTemplateWithFullDays | null>
  update(id: string, data: CreateRoutineTemplateData): Promise<RoutineTemplateWithDays>
  duplicate(id: string): Promise<RoutineTemplateWithDays>
  delete(id: string): Promise<void>
  countAssignments(id: string): Promise<number>
}

export interface AssignOverrideData {
  exerciseBlockId: string
  sets?: number | null
  reps?: number | null
  repsScheme?: string | null
  weightKg?: number | null
  intensity?: string | null
  tempo?: string | null
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
        repsScheme: string | null
        weightKg: number | null
        intensity: string | null
        tempo: string | null
        durationSecs: number | null
        restSecs: number | null
        trainerNotes: string | null
        blockOrder: number
        groupLabel: string | null
        groupRestSecs: number | null
        exercise: { name: string; videoUrl: string | null }
      }[]
    }[]
  }
  overrides: {
    exerciseBlockId: string
    sets: number | null
    reps: number | null
    repsScheme: string | null
    weightKg: number | null
    intensity: string | null
    tempo: string | null
    durationSecs: number | null
    restSecs: number | null
    trainerNotes: string | null
  }[]
}

export type AdherenceStat = {
  studentId: string
  studentName: string
  completedSessions: number
  expectedSessions: number
  daysSinceLastLog: number | null
}

export interface IAssignedRoutineRepository {
  assign(data: AssignRoutineData): Promise<AssignedRoutine>
  findActiveByStudentId(studentId: string): Promise<AssignedRoutineWithTemplate | null>
  findHistoryByStudentId(studentId: string): Promise<AssignedRoutineWithTemplate[]>
  findByIdWithDetails(id: string): Promise<AssignedRoutineRaw | null>
  countActive(): Promise<number>
  findAdherenceStats(): Promise<AdherenceStat[]>
}

export interface UpsertProgressLogData {
  studentId: string
  assignedRoutineId: string
  exerciseBlockId: string
  loggedDate: Date
  completed?: boolean
  weightKg?: number | null
  studentNotes?: string | null
  noteType?: NoteType | null
}

export type ProgressLogEntry = {
  exerciseBlockId: string
  completed: boolean
  weightKg: number | null
  studentNotes: string | null
  noteType: NoteType | null
}

export type ProgressHistoryEntry = {
  loggedDate: Date
  exerciseBlockId: string
  exerciseName: string
  completed: boolean
  weightKg: number | null
  studentNotes: string | null
  noteType: NoteType | null
}

export interface ProgressHistoryFilters {
  from?: Date
  to?: Date
  noteType?: NoteType
}

export type BodyWeightEntry = {
  id: string
  loggedDate: Date
  weightKg: number
}

export interface LogBodyWeightData {
  studentId: string
  loggedDate: Date
  weightKg: number
}

export interface IBodyWeightRepository {
  upsert(data: LogBodyWeightData): Promise<void>
  findByStudent(studentId: string): Promise<BodyWeightEntry[]>
  findForDay(studentId: string, loggedDate: Date): Promise<BodyWeightEntry | null>
}

export interface IProgressLogRepository {
  upsert(data: UpsertProgressLogData): Promise<void>
  findForDay(studentId: string, loggedDate: Date): Promise<ProgressLogEntry[]>
  findByStudent(
    studentId: string,
    filters: ProgressHistoryFilters,
  ): Promise<ProgressHistoryEntry[]>
}

export type GenericProfileWithTemplate = {
  id: string
  level: GenericLevel
  passwordHash: string
  assignedTemplateId: string | null
  assignedTemplate: { id: string; name: string } | null
  updatedAt: Date
}

export interface IGenericProfileRepository {
  findAll(): Promise<GenericProfileWithTemplate[]>
  findByLevel(level: GenericLevel): Promise<GenericProfileWithTemplate | null>
  assignTemplate(level: GenericLevel, templateId: string | null): Promise<GenericProfileWithTemplate>
  updatePasswordHash(level: GenericLevel, passwordHash: string): Promise<void>
}
