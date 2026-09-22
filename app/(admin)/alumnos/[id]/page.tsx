import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StudentForm } from "@/components/admin/student-form"
import { DeactivateStudentButton } from "@/components/admin/deactivate-student-button"
import { ReactivateStudentButton } from "@/components/admin/reactivate-student-button"
import { WhatsAppActions } from "@/components/admin/whatsapp-actions"
import { FlashToast } from "@/components/admin/flash-toast"
import { requireCoachAuth } from "@/lib/auth"
import { updateStudentAction } from "@/lib/actions/student.actions"
import { studentService } from "@/lib/services/student.service"
import { evaluateStudentAccess } from "@/lib/utils/student-access"
import { assignedRoutineService } from "@/lib/services/assigned-routine.service"
import { bodyWeightService } from "@/lib/services/body-weight.service"
import { objetivoService } from "@/lib/services/objetivo.service"
import { modalidadService } from "@/lib/services/modalidad.service"
import { planService } from "@/lib/services/plan.service"
import { subscriptionService } from "@/lib/services/subscription.service"
import { paymentService } from "@/lib/services/payment.service"
import { StudentSubscriptionLedgerCard } from "@/components/admin/student-subscription-ledger-card"

// DB-backed detail (student + active routine) — must be fresh on every visit.
export const dynamic = "force-dynamic"

function toDateInputValue(date: Date | null) {
  if (!date) return ""
  return date.toISOString().slice(0, 10)
}

export default async function AlumnoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireCoachAuth()
  const { id } = await params
  const student = await studentService.getById(id)

  if (!student || student.trainerId !== user.id) notFound()

  const access = evaluateStudentAccess(student)

  const [
    activeRoutine,
    routineHistory,
    bodyWeightHistory,
    objetivos,
    modalidades,
    availablePlans,
    currentSubscription,
    statement,
  ] = await Promise.all([
    assignedRoutineService.getActiveByStudentId(id),
    assignedRoutineService.getHistoryByStudentId(id),
    bodyWeightService.history(id),
    objetivoService.list(),
    modalidadService.list(),
    planService.list(false, user.id),
    subscriptionService.getLatestByStudentId(id),
    paymentService.getAccountStatement(id),
  ])

  const defaultValues = {
    firstName: student.firstName,
    lastName: student.lastName,
    dni: student.dni,
    email: student.email ?? "",
    phone: student.phone ?? "",
    objetivoId: student.objetivoId ?? "",
    secondaryGoals: student.secondaryGoals ?? "",
    nivel: student.nivel ?? "",
    modalidadId: student.modalidadId ?? "",
    membershipStartsAt: toDateInputValue(student.membershipStartsAt),
    paymentExpiresAt: toDateInputValue(student.paymentExpiresAt),
    accessOverride: student.accessOverride ?? "auto",
    height: student.height ? String(student.height) : "",
    age: student.age ? String(student.age) : "",
    healthNotes: student.healthNotes ?? "",
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Suspense>
        <FlashToast
          messages={{
            assigned: "Rutina asignada correctamente.",
            reactivated: "Alumno reactivado.",
          }}
        />
      </Suspense>

      <StudentSubscriptionLedgerCard
        studentId={student.id}
        studentName={`${student.firstName} ${student.lastName}`}
        availablePlans={availablePlans}
        currentSubscription={currentSubscription}
        statement={statement}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Rutina
            <div className="flex gap-2">
              <Button
                variant="ghost"
                render={<Link href={`/alumnos/${student.id}/progreso`} />}
              >
                Ver progreso
              </Button>
              <Button
                variant="outline"
                render={<Link href={`/alumnos/${student.id}/asignar`} />}
              >
                {activeRoutine ? "Reasignar rutina" : "Asignar rutina"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeRoutine ? (
            <p className="text-sm">
              Activa: <span className="font-medium">{activeRoutine.template.name}</span>
              {activeRoutine.expiresAt &&
                ` · vence ${new Intl.DateTimeFormat("es-AR").format(activeRoutine.expiresAt)}`}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Sin rutina activa.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Historial de rutinas</CardTitle>
        </CardHeader>
        <CardContent>
          {routineHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no tiene rutinas asignadas.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {routineHistory.map((routine) => (
                <li key={routine.id}>
                  <Link
                    href={`/alumnos/${student.id}/rutinas/${routine.id}`}
                    className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/50"
                  >
                    <span>
                      {routine.template.name} ·{" "}
                      {new Intl.DateTimeFormat("es-AR").format(routine.assignedAt)}
                    </span>
                    <Badge variant={routine.status === "active" ? "default" : "secondary"}>
                      {routine.status === "active" ? "Activa" : "Histórico"}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {bodyWeightHistory.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Peso Corporal</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1 text-sm">
              {bodyWeightHistory.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between border-b py-1 last:border-b-0">
                  <span className="text-muted-foreground">
                    {new Intl.DateTimeFormat("es-AR").format(entry.loggedDate)}
                  </span>
                  <span className="font-medium">{entry.weightKg} kg</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>
                {student.firstName} {student.lastName}
              </CardTitle>
              {!student.isActive ? (
                <Badge variant="destructive">Inactivo</Badge>
              ) : access.allowed ? (
                access.reason === "manual_allowed" ? (
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 font-medium">
                    Acceso Permitido (Excepción)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 font-medium">
                    Acceso Habilitado
                  </Badge>
                )
              ) : access.reason === "expired" ? (
                <Badge variant="destructive">
                  Acceso Bloqueado (Cuota Vencida)
                </Badge>
              ) : (
                <Badge variant="destructive">
                  Acceso Suspendido
                </Badge>
              )}
            </div>
            <WhatsAppActions
              phone={student.phone}
              firstName={student.firstName}
              paymentExpiresAt={student.paymentExpiresAt}
            />
          </div>
        </CardHeader>
        <CardContent>
          <StudentForm
            mode="edit"
            action={updateStudentAction.bind(null, student.id)}
            defaultValues={defaultValues}
            objetivos={objetivos}
            modalidades={modalidades}
          />

          <div className="mt-8 flex justify-end border-t pt-6">
            {student.isActive ? (
              <DeactivateStudentButton
                studentId={student.id}
                studentName={`${student.firstName} ${student.lastName}`}
              />
            ) : (
              <ReactivateStudentButton studentId={student.id} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
