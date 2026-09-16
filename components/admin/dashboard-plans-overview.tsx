import Link from "next/link";
import { Users, CreditCard, ArrowUpRight, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlanMetricsDTO } from "@/lib/repositories/interfaces";

interface DashboardPlansOverviewProps {
  metrics: PlanMetricsDTO;
  totalActiveStudents: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DashboardPlansOverview({
  metrics,
  totalActiveStudents,
}: DashboardPlansOverviewProps) {
  const totalEstimatedMonthly = metrics.plans.reduce(
    (acc, p) => acc + p.estimatedMonthlyRevenue,
    0,
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CreditCard className="size-4 text-primary" />
            Planes
          </CardTitle>
          <CardDescription className="text-xs">
            Alumnos suscritos y facturación proyectada por plan
          </CardDescription>
        </div>
        <div className="flex items-center sm:justify-end sm:w-full gap-2">
          <Badge variant="outline" className="text-xs">
            {metrics.activePlansCount} / {metrics.maxActivePlans} activos
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/planes" />}
            className="h-8 px-2 text-xs"
          >
            Ver todos
            <ArrowUpRight className="size-3.5 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        {metrics.plans.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
            <Sparkles className="size-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium">
              No hay planes activos configurados
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Creá hasta 3 planes para estructurar tus cobros y membresías.
            </p>
            <Button size="sm" render={<Link href="/planes" />}>
              Crear Plan
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {metrics.plans.map((plan) => {
              const studentPercentage =
                totalActiveStudents > 0
                  ? Math.round(
                      (plan.activeStudentsCount / totalActiveStudents) * 100,
                    )
                  : 0;

              return (
                <div
                  key={plan.id}
                  className="flex flex-col justify-between rounded-lg border bg-card p-3.5 transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-sm line-clamp-1">
                        {plan.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="font-mono text-xs shrink-0"
                      >
                        {formatCurrency(plan.price)}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Ciclo de {plan.durationDays} días
                    </span>
                  </div>

                  <div className="mt-4 pt-2 border-t flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="size-3.5" />
                        <span>
                          {plan.activeStudentsCount} alumnos (
                          {studentPercentage}%)
                        </span>
                      </div>
                      <p className="font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatCurrency(plan.estimatedMonthlyRevenue)}/mes
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              Facturación proyectada total:{" "}
              <strong className="text-foreground font-mono">
                {formatCurrency(totalEstimatedMonthly)}
              </strong>
            </span>
          </div>
          {metrics.unassignedStudentsCount > 0 && (
            <Badge
              variant="outline"
              className="text-[11px] text-amber-600 dark:text-amber-400"
            >
              {metrics.unassignedStudentsCount} alumno(s) sin plan asignado
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
