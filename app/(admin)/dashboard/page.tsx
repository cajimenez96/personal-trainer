import Link from "next/link"
import { auth } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { studentService } from "@/lib/services/student.service"
import { assignedRoutineService } from "@/lib/services/assigned-routine.service"

// DB-backed counts — must reflect the current state on every visit.
export const dynamic = "force-dynamic"

const CUOTA_WARNING_DAYS = 7
const INACTIVITY_WARNING_DAYS = 7

function adherenceBadgeVariant(ratio: number): "success" | "secondary" | "destructive" {
  if (ratio >= 0.8) return "success"
  if (ratio >= 0.5) return "secondary"
  return "destructive"
}

export default async function DashboardPage() {
  const [session, activeStudents, expiringSoon, activeRoutines, adherenceStats] = await Promise.all([
    auth(),
    studentService.countActive(),
    studentService.countExpiringSoon(CUOTA_WARNING_DAYS),
    assignedRoutineService.countActive(),
    assignedRoutineService.getAdherenceStats(),
  ])

  const stats = [
    { label: "Alumnos activos", value: activeStudents, href: "/alumnos" },
    {
      label: `Cuotas vencidas o por vencer (${CUOTA_WARNING_DAYS} días)`,
      value: expiringSoon,
      href: "/alumnos",
    },
    { label: "Rutinas activas", value: activeRoutines, href: "/alumnos" },
  ]

  const inactiveStudents = adherenceStats.filter(
    (s) => s.daysSinceLastLog === null || s.daysSinceLastLog >= INACTIVITY_WARNING_DAYS,
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Hola, {session?.user?.name}</h1>
        <p className="text-muted-foreground">Panel de administración.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-3xl font-semibold">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
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
          <CardHeader>
            <CardTitle>Adherencia</CardTitle>
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
                          <span className="text-muted-foreground">
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
              Aproximado por volumen (días de la plantilla × semanas transcurridas) — no por
              calendario exacto.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
