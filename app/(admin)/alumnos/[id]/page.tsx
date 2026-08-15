import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StudentForm } from "@/components/admin/student-form"
import { DeactivateStudentButton } from "@/components/admin/deactivate-student-button"
import { ReactivateStudentButton } from "@/components/admin/reactivate-student-button"
import { FlashToast } from "@/components/admin/flash-toast"
import { updateStudentAction } from "@/lib/actions/student.actions"
import { studentService } from "@/lib/services/student.service"
import { assignedRoutineService } from "@/lib/services/assigned-routine.service"

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
  const { id } = await params
  const student = await studentService.getById(id)

  if (!student) notFound()

  const [activeRoutine, routineHistory] = await Promise.all([
    assignedRoutineService.getActiveByStudentId(id),
    assignedRoutineService.getHistoryByStudentId(id),
  ])

  const defaultValues = {
    firstName: student.firstName,
    lastName: student.lastName,
    dni: student.dni,
    email: student.email ?? "",
    phone: student.phone ?? "",
    objetivo: student.objetivo ?? "",
    nivel: student.nivel ?? "",
    modalidad: student.modalidad ?? "",
    membershipStartsAt: toDateInputValue(student.membershipStartsAt),
    paymentExpiresAt: toDateInputValue(student.paymentExpiresAt),
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>
              {student.firstName} {student.lastName}
            </CardTitle>
            {!student.isActive && <Badge variant="destructive">Inactivo</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <StudentForm
            mode="edit"
            action={updateStudentAction.bind(null, student.id)}
            defaultValues={defaultValues}
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
