import Link from "next/link";
import { db } from "@/lib/db";
import { requireSuperAdminAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Users, Dumbbell, ShieldAlert } from "lucide-react";
import { CreateCoachDialog } from "@/components/superadmin/create-coach-dialog";
import { EditCoachDialog } from "@/components/superadmin/edit-coach-dialog";
import { CoachStatusToggle } from "@/components/superadmin/coach-status-toggle";
import { ResetPasswordDialog } from "@/components/superadmin/reset-password-dialog";

export const dynamic = "force-dynamic";

export default async function SuperAdminCoachesPage() {
  const currentAdmin = await requireSuperAdminAuth();

  const coaches = await db.trainer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          students: true,
          routineTemplates: true,
          plans: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Gestión de Profesores & Tenants
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administrá los entrenadores registrados, sus URLs personalizadas
            (slugs) y el estado de sus cuentas.
          </p>
        </div>
        <CreateCoachDialog />
      </div>

      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Todos los Entrenadores ({coaches.length})
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Tenants aislados con acceso a panel y portal propio
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Profesor / Marca</th>
                  <th className="py-3 px-4">Slug Portal</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4 text-center">Cupo Alumnos</th>
                  <th className="py-3 px-4 text-center">Cupo Planes</th>
                  <th className="py-3 px-4 text-center">Alta</th>
                  <th className="py-3 px-4 text-center">Vencimiento</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coaches.map((coach) => {
                  const isCurrent = coach.id === currentAdmin.id;
                  return (
                    <tr
                      key={coach.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">
                          {coach.name}
                        </div>
                        {coach.businessName && (
                          <div className="text-xs text-muted-foreground">
                            {coach.businessName}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {coach.email}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          href={`/${coach.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-primary hover:underline bg-primary/5 px-2 py-1 rounded"
                        >
                          /{coach.slug}
                          <ExternalLink className="size-3" />
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        {coach.role === "SUPERADMIN" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                            <ShieldAlert className="size-3.5" />
                            SuperAdmin
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Coach
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-foreground">
                          {coach._count.students}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          / {coach.maxStudents}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-foreground">
                          {coach._count.plans}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          / {coach.maxPlans}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-xs text-muted-foreground whitespace-nowrap">
                        {coach.createdAt
                          ? new Date(coach.createdAt).toLocaleDateString(
                              "es-AR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </td>

                      <td className="py-3.5 px-4 text-center text-xs whitespace-nowrap">
                        {coach.membershipExpiresAt ? (
                          <span className="font-medium text-foreground">
                            {new Date(
                              coach.membershipExpiresAt,
                            ).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Sin límite
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={coach.isActive ? "default" : "destructive"}
                          className="text-[11px]"
                        >
                          {coach.isActive ? "Activo" : "Suspendido"}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <EditCoachDialog coach={coach} />
                          <ResetPasswordDialog
                            trainerId={coach.id}
                            coachName={coach.name}
                          />
                          <CoachStatusToggle
                            trainerId={coach.id}
                            coachName={coach.name}
                            isActive={coach.isActive}
                            isCurrentAdmin={isCurrent}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
