import Link from "next/link"
import { Users, Calendar, CreditCard, DollarSign } from "lucide-react"
import { auth } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { studentService } from "@/lib/services/student.service"
import { assignedRoutineService } from "@/lib/services/assigned-routine.service"
import { paymentService } from "@/lib/services/payment.service"
import { planService } from "@/lib/services/plan.service"
import { objetivoService } from "@/lib/services/objetivo.service"
import { modalidadService } from "@/lib/services/modalidad.service"
import { createObjetivoAction, renameObjetivoAction, deleteObjetivoAction } from "@/lib/actions/objetivo.actions"
import { createModalidadAction, renameModalidadAction, deleteModalidadAction } from "@/lib/actions/modalidad.actions"
import { ManagedListCard } from "@/components/admin/managed-list-card"
import { DashboardPlansOverview } from "@/components/admin/dashboard-plans-overview"
import { DashboardExpirationsCard } from "@/components/admin/dashboard-expirations-card"

// DB-backed counts — must reflect the current state on every visit.
export const dynamic = "force-dynamic"

const CUOTA_WARNING_DAYS = 14
const INACTIVITY_WARNING_DAYS = 7

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount)
}

function adherenceBadgeVariant(ratio: number): "success" | "secondary" | "destructive" {
  if (ratio >= 0.8) return "success"
  if (ratio >= 0.5) return "secondary"
  return "destructive"
}

export default async function DashboardPage() {
  const [
    session,
    activeStudents,
    expiringSoonCount,
    expiringStudents,
    activeRoutines,
    adherenceStats,
    financialSummary,
    planMetrics,
    objetivos,
    modalidades,
  ] = await Promise.all([
    auth(),
    studentService.countActive(),
    studentService.countExpiringSoon(CUOTA_WARNING_DAYS),
    studentService.getExpiringStudents(CUOTA_WARNING_DAYS),
    assignedRoutineService.countActive(),
    assignedRoutineService.getAdherenceStats(),
    paymentService.getFinancialSummary(),
    planService.getPlanMetrics(),
    objetivoService.list(),
    modalidadService.list(),
  ])

  const inactiveStudents = adherenceStats.filter(
    (s) => s.daysSinceLastLog === null || s.daysSinceLastLog >= INACTIVITY_WARNING_DAYS,
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Hola, {session?.user?.name}</h1>
        <p className="text-muted-foreground text-sm">
          Panel de control, seguimiento de planes y finanzas de tu gimnasio.
        </p>
      </div>

      {/* Top Financial & Operational KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-colors hover:border-emerald-500/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Ingresos del Mes
            </CardTitle>
            <DollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(financialSummary.monthlyRevenue)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Total histórico: {formatCurrency(financialSummary.totalPaidAllTime)}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-colors hover:border-red-500/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Dinero Pendiente
            </CardTitle>
            <CreditCard className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
              {formatCurrency(financialSummary.totalPendingBalance)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {financialSummary.debtorStudentsCount}{" "}
              {financialSummary.debtorStudentsCount === 1 ? "alumno deudor" : "alumnos con saldo deudor"}
            </p>
          </CardContent>
        </Card>

        <Link href="/alumnos" className="block">
          <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Alumnos Activos
              </CardTitle>
              <Users className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl font-bold">{activeStudents}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {expiringSoonCount} con cuota vencida o por vencer
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/planes" className="block">
          <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Planes Activos
              </CardTitle>
              <Calendar className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl font-bold">
                {planMetrics.activePlansCount}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {planMetrics.maxActivePlans}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {planMetrics.unassignedStudentsCount > 0
                  ? `${planMetrics.unassignedStudentsCount} alumnos sin plan`
                  : "Todos con plan asignado"}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Plans Distribution & Performance */}
      <DashboardPlansOverview
        metrics={planMetrics}
        totalActiveStudents={activeStudents}
      />

      {/* Upcoming & Overdue Expirations */}
      <DashboardExpirationsCard
        students={expiringStudents}
        warningDays={CUOTA_WARNING_DAYS}
      />

      {/* Training & Adherence Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Alumnos sin entrenar hace {INACTIVITY_WARNING_DAYS}+ días
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inactiveStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todos los alumnos con rutina activa entrenaron recientemente.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {inactiveStudents.map((s) => (
                  <li key={s.studentId}>
                    <Link
                      href={`/alumnos/${s.studentId}`}
                      className="flex items-center justify-between rounded-md p-2 text-sm hover:bg-muted/50"
                    >
                      <span>{s.studentName}</span>
                      <Badge variant="destructive">
                        {s.daysSinceLastLog === null ? "Sin registros" : `${s.daysSinceLastLog}d`}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Adherencia de Rutinas</CardTitle>
            <Badge variant="outline" className="text-xs">
              {activeRoutines} rutinas activas
            </Badge>
          </CardHeader>
          <CardContent>
            {adherenceStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nadie tiene una rutina activa todavía.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {adherenceStats.map((s) => {
                  const ratio =
                    s.expectedSessions > 0 ? s.completedSessions / s.expectedSessions : 0
                  return (
                    <li key={s.studentId}>
                      <Link
                        href={`/alumnos/${s.studentId}`}
                        className="flex items-center justify-between rounded-md p-2 text-sm hover:bg-muted/50"
                      >
                        <span>{s.studentName}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">
                            {s.completedSessions}/{s.expectedSessions}
                          </span>
                          <Badge variant={adherenceBadgeVariant(ratio)}>
                            {Math.round(ratio * 100)}%
                          </Badge>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Aproximado por volumen (días de la plantilla × semanas transcurridas).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lists management */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Listas de alumnos</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ManagedListCard
            title="Objetivos"
            items={objetivos}
            createAction={createObjetivoAction}
            renameAction={renameObjetivoAction}
            deleteAction={deleteObjetivoAction}
          />
          <ManagedListCard
            title="Modalidades"
            items={modalidades}
            createAction={createModalidadAction}
            renameAction={renameModalidadAction}
            deleteAction={deleteModalidadAction}
          />
        </div>
      </div>
    </div>
  )
}

