import type {
  AccessOverride,
  AssignedRoutine,
  Exercise,
  GenericLevel,
  Nivel,
  NoteType,
  Payment,
  Plan,
  RoutineTemplate,
  Student,
  StudentSubscription,
} from "@/app/generated/prisma/client"

export interface CreateStudentData {
  trainerId?: string
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
  accessOverride?: AccessOverride
  height?: number | null
  age?: number | null
  initialWeightKg?: number | null
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
  accessOverride?: AccessOverride
  height?: number | null
  age?: number | null
  healthNotes: string | null
}

export interface StudentFilters {
  trainerId?: string
  search?: string
  objetivoId?: string
  nivel?: Nivel
  modalidadId?: string
  planId?: string
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
  subscriptions?: {
    id: string
    planId: string
    plan: {
      id: string
      name: string
    }
  }[]
}

export interface StudentListResult {
  items: StudentWithTaxonomies[]
  nextCursor: string | null
}

export interface IStudentRepository {
  findMany(params: StudentListParams): Promise<StudentListResult>
  findById(id: string): Promise<Student | null>
  findByDni(dni: string, trainerId?: string): Promise<Student | null>
  create(data: CreateStudentData): Promise<Student>
  update(id: string, data: UpdateStudentData): Promise<Student>
  deactivate(id: string): Promise<Student>
  reactivate(id: string): Promise<Student>
  findAllActive(filters: StudentFilters): Promise<Student[]>
  countActive(trainerId?: string): Promise<number>
  countExpiringSoon(before: Date, trainerId?: string): Promise<number>
}

export interface ExerciseFilters {
  search?: string
  muscleGroup?: string
  trainerId?: string | null
  globalOnly?: boolean
}

export interface CreateExerciseData {
  trainerId?: string | null
  name: string
  primaryMuscle: string
  secondaryMuscle?: string | null
  videoUrl?: string | null
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
  findByName(name: string, trainerId?: string | null): Promise<Exercise | null>
  listMuscleGroups(trainerId?: string | null): Promise<string[]>
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
  trainerId?: string
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
  findMany(trainerId?: string): Promise<RoutineTemplateWithDays[]>
  findById(id: string): Promise<RoutineTemplateWithFullDays | null>
  update(id: string, data: CreateRoutineTemplateData): Promise<RoutineTemplateWithDays>
  duplicate(id: string, targetTrainerId?: string): Promise<RoutineTemplateWithDays>
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
  countActive(trainerId?: string): Promise<number>
  findAdherenceStats(trainerId?: string): Promise<AdherenceStat[]>
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
  trainerId: string
  name: string
  level?: GenericLevel | null
  passwordHash: string
  assignedTemplateId: string | null
  assignedTemplate: { id: string; name: string } | null
  createdAt?: Date
  updatedAt: Date
}

export interface CreateGenericProfileData {
  name: string
  passwordHash: string
  trainerId: string
  assignedTemplateId?: string | null
}

export interface UpdateGenericProfileData {
  name?: string
  passwordHash?: string
  assignedTemplateId?: string | null
}

export interface IGenericProfileRepository {
  findAll(trainerId?: string): Promise<GenericProfileWithTemplate[]>
  findById(id: string, trainerId?: string): Promise<GenericProfileWithTemplate | null>
  findByLevel(level: GenericLevel, trainerId?: string): Promise<GenericProfileWithTemplate | null>
  create(data: CreateGenericProfileData): Promise<GenericProfileWithTemplate>
  update(id: string, data: UpdateGenericProfileData, trainerId?: string): Promise<GenericProfileWithTemplate>
  delete(id: string, trainerId?: string): Promise<void>
  count(trainerId?: string): Promise<number>
  assignTemplate(levelOrId: string, templateId: string | null, trainerId?: string): Promise<GenericProfileWithTemplate>
  updatePasswordHash(levelOrId: string, passwordHash: string, trainerId?: string): Promise<void>
}

// ─────────────────────────────────────────────
// PLANS & SUBSCRIPTIONS
// ─────────────────────────────────────────────

export interface PlanDTO {
  id: string
  trainerId: string
  name: string
  description: string | null
  price: number
  durationDays: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreatePlanData {
  trainerId?: string
  name: string
  description?: string | null
  price: number
  durationDays?: number
}

export interface UpdatePlanData {
  name: string
  description?: string | null
  price: number
  durationDays?: number
  isActive?: boolean
}

export interface IPlanRepository {
  findAll(includeInactive?: boolean, trainerId?: string): Promise<PlanDTO[]>
  findById(id: string): Promise<PlanDTO | null>
  findByName(name: string, trainerId?: string): Promise<PlanDTO | null>
  create(data: CreatePlanData): Promise<PlanDTO>
  update(id: string, data: UpdatePlanData): Promise<PlanDTO>
  delete(id: string): Promise<void>
  countActive(trainerId?: string): Promise<number>
  countSubscriptions(planId: string): Promise<number>
}

export interface CreateSubscriptionData {
  studentId: string
  planId: string
  priceSnapshot: number
  startDate: Date
  expiresAt: Date
}

export type StudentSubscriptionWithPlan = {
  id: string
  studentId: string
  planId: string
  priceSnapshot: number
  startDate: Date
  expiresAt: Date
  createdAt: Date
  plan: PlanDTO
}

export interface ISubscriptionRepository {
  create(data: CreateSubscriptionData): Promise<StudentSubscriptionWithPlan>
  findByStudentId(studentId: string): Promise<StudentSubscriptionWithPlan[]>
  findLatestByStudentId(studentId: string): Promise<StudentSubscriptionWithPlan | null>
  findById(id: string): Promise<StudentSubscriptionWithPlan | null>
}

// ─────────────────────────────────────────────
// PAYMENTS & LEDGER
// ─────────────────────────────────────────────

export interface CreatePaymentData {
  studentId: string
  subscriptionId?: string | null
  amount: number
  paidAt: Date
  notes?: string | null
}

export interface PaymentDTO {
  id: string
  studentId: string
  subscriptionId: string | null
  amount: number
  paidAt: Date
  notes: string | null
  createdAt: Date
}

export type PaymentWithSubscription = PaymentDTO & {
  subscription: StudentSubscriptionWithPlan | null
}

export interface IPaymentRepository {
  create(data: CreatePaymentData): Promise<PaymentDTO>
  findByStudentId(studentId: string): Promise<PaymentWithSubscription[]>
  findById(id: string): Promise<PaymentDTO | null>
  delete(id: string): Promise<void>
}

export type LedgerTransaction = {
  id: string
  type: "CHARGE" | "PAYMENT"
  date: Date
  description: string
  amount: number
  referenceId?: string
}

export type AccountStatement = {
  totalCharges: number
  totalPaid: number
  balance: number
  transactions: LedgerTransaction[]
}

// ─────────────────────────────────────────────
// DASHBOARD METRICS & REPORTS
// ─────────────────────────────────────────────

export interface FinancialSummaryDTO {
  monthlyRevenue: number
  totalPendingBalance: number
  debtorStudentsCount: number
  totalPaidAllTime: number
}

export interface PlanMetricsItemDTO {
  id: string
  name: string
  price: number
  durationDays: number
  isActive: boolean
  activeStudentsCount: number
  estimatedMonthlyRevenue: number
}

export interface PlanMetricsDTO {
  activePlansCount: number
  maxActivePlans: number
  plans: PlanMetricsItemDTO[]
  unassignedStudentsCount: number
}

export interface ExpiringStudentDTO {
  id: string
  firstName: string
  lastName: string
  dni: string
  phone: string | null
  paymentExpiresAt: Date | null
  daysRemaining: number | null
  isOverdue: boolean
  planName: string | null
  planPrice: number | null
  pendingBalance: number
  accessOverride: "auto" | "allowed" | "blocked"
  isActive: boolean
}

