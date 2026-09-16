import { redirect } from "next/navigation"
import { dniSchema } from "@/lib/validators/portal"
import { studentService } from "@/lib/services/student.service"
import { assignedRoutineService } from "@/lib/services/assigned-routine.service"
import { progressLogService } from "@/lib/services/progress-log.service"
import { bodyWeightService } from "@/lib/services/body-weight.service"
import { evaluateStudentAccess } from "@/lib/utils/student-access"
import { StudentAccessBlocked } from "@/components/portal/student-access-blocked"
import { BodyWeightInput } from "@/components/portal/body-weight-input"
import { DayWeightsDialogs } from "@/components/portal/day-weights-dialog"
import { ExerciseProgress } from "@/components/portal/exercise-progress"
import { RoutinePortalHeader } from "@/components/portal/routine-portal-header"
import { RoutineDayAccordion } from "@/components/portal/routine-day-accordion"
import { NoRoutineAssignedMessage } from "@/components/portal/no-routine-assigned-message"

// Stateless by design — every visit re-validates the DNI and re-reads the
// student's current active routine. Never cache across requests.
export const dynamic = "force-dynamic"

export default async function RutinaPage({
  params,
}: {
  params: Promise<{ dni: string }>
}) {
  const { dni: rawDni } = await params

  const parsed = dniSchema.safeParse(rawDni)
  if (!parsed.success) redirect("/?error=invalid")

  const student = await studentService.getByDni(parsed.data)
  if (!student) redirect("/?error=not-found")

  const access = evaluateStudentAccess(student)
  if (!access.allowed) {
    return (
      <StudentAccessBlocked
        studentName={`${student.firstName} ${student.lastName}`}
        reason={access.reason}
        expiresAt={access.expiresAt}
      />
    )
  }

  const activeRoutine = await assignedRoutineService.getActiveByStudentId(student.id)

  if (!activeRoutine) {
    return (
      <NoRoutineAssignedMessage
        greetingName={student.firstName}
        backHref="/"
        backLabel="Volver a ingresar DNI"
      />
    )
  }

  const routine = await assignedRoutineService.getDetail(activeRoutine.id)
  if (!routine) redirect("/?error=not-found")

  const [todayProgress, todayBodyWeight] = await Promise.all([
    progressLogService.getForToday(student.id),
    bodyWeightService.getForToday(student.id),
  ])
  const progressByBlock = new Map(todayProgress.map((p) => [p.exerciseBlockId, p]))

  return (
    <div className="min-h-screen bg-[#efefef] pb-12 dark:bg-background">
      <RoutinePortalHeader
        greetingLabel="Hola,"
        title={`${student.firstName} ${student.lastName}`}
        subtitle={routine.templateName}
        trailingSlot={
          <BodyWeightInput dni={parsed.data} initialWeightKg={todayBodyWeight?.weightKg ?? null} />
        }
      />

      <main className="flex flex-col gap-3 px-3 py-4 sm:px-4">
        {routine.days.length === 0 && (
          <p className="text-center text-muted-foreground">
            Esta rutina todavía no tiene días cargados.
          </p>
        )}

        <RoutineDayAccordion
          days={routine.days}
          renderDayActions={(day) =>
            day.blocks.length > 0 ? (
              <DayWeightsDialogs
                dni={parsed.data}
                assignedRoutineId={routine.id}
                blocks={day.blocks}
                progressByBlock={progressByBlock}
              />
            ) : null
          }
          renderBlockTrailing={(block) => (
            <ExerciseProgress
              dni={parsed.data}
              assignedRoutineId={routine.id}
              exerciseBlockId={block.id}
              initialCompleted={progressByBlock.get(block.id)?.completed ?? false}
              initialWeightKg={progressByBlock.get(block.id)?.weightKg ?? null}
              initialNotes={progressByBlock.get(block.id)?.studentNotes ?? null}
              initialNoteType={progressByBlock.get(block.id)?.noteType ?? null}
              restSecs={block.restSecs}
            />
          )}
        />
      </main>
    </div>
  )
}
