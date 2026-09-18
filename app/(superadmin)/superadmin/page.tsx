import Link from "next/link"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  UserCheck,
  Dumbbell,
  CalendarCheck,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from "lucide-react"
import { CreateCoachDialog } from "@/components/superadmin/create-coach-dialog"

export const dynamic = "force-dynamic"

export default async function SuperAdminDashboardPage() {
  const [
    totalCoaches,
    activeCoaches,
    totalStudents,
    activeStudents,
    activeRoutines,
    recentCoaches,
  ] = await Promise.all([
    db.trainer.count(),
    db.trainer.count({ where: { isActive: true } }),
    db.student.count(),
    db.student.count({ where: { isActive: true } }),
    db.assignedRoutine.count({ where: { status: "active" } }),
    db.trainer.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { students: true, routineTemplates: true },
        },
      },
    }),
  ])

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Panel de Control SuperAdmin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión global de la plataforma SaaS, profesores y métricas de
            adopción multi-tenant.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreateCoachDialog />
          <Button
            variant="outline"
            render={<Link href="/superadmin/coaches" />}
            className="gap-2"
          >
            Ver Todos los Profesores
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Entrenadores
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <ShieldCheck className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCoaches}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-emerald-600">
                {activeCoaches} activos
              </span>{" "}
              / {totalCoaches - activeCoaches} suspendidos
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alumnos en la Plataforma
            </CardTitle>
            <div className="rounded-full bg-blue-500/10 p-2 text-blue-500">
              <Users className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-blue-600">
                {activeStudents} con membresía activa
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rutinas Activas
            </CardTitle>
            <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-500">
              <CalendarCheck className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRoutines}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Asignadas y en ejecución
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Actividad
            </CardTitle>
            <div className="rounded-full bg-amber-500/10 p-2 text-amber-500">
              <UserCheck className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCoaches > 0
                ? `${Math.round((activeCoaches / totalCoaches) * 100)}%`
                : "100%"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tenants operativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Coaches Table Preview */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Últimos Profesores Registrados</CardTitle>
            <p className="text-xs text-muted-foreground">
              Nuevos tenants incorporados al sistema
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/superadmin/coaches" />}
            className="gap-1.5 text-xs"
          >
            Ver listado completo &rarr;
          </Button>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {recentCoaches.map((coach) => (
              <div
                key={coach.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {coach.name}
                    </span>
                    {coach.businessName && (
                      <span className="text-xs text-muted-foreground">
                        ({coach.businessName})
                      </span>
                    )}
                    <Badge
                      variant={coach.isActive ? "default" : "destructive"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {coach.isActive ? "Activo" : "Suspendido"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{coach.email}</span>
                    <span>•</span>
                    <Link
                      href={`/${coach.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 font-mono text-primary hover:underline"
                    >
                      /{coach.slug}
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground sm:text-right">
                  <div>
                    <span className="font-bold text-foreground">
                      {coach._count.students}
                    </span>{" "}
                    alumnos
                  </div>
                  <div>
                    <span className="font-bold text-foreground">
                      {coach._count.routineTemplates}
                    </span>{" "}
                    plantillas
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
