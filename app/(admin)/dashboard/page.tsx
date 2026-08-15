import Link from "next/link"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { studentService } from "@/lib/services/student.service"
import { assignedRoutineService } from "@/lib/services/assigned-routine.service"

// DB-backed counts — must reflect the current state on every visit.
export const dynamic = "force-dynamic"

const CUOTA_WARNING_DAYS = 7

export default async function DashboardPage() {
  const [session, activeStudents, expiringSoon, activeRoutines] = await Promise.all([
    auth(),
    studentService.countActive(),
    studentService.countExpiringSoon(CUOTA_WARNING_DAYS),
    assignedRoutineService.countActive(),
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
    </div>
  )
}
