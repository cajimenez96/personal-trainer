"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ExpiringStudentDTO } from "@/lib/repositories/interfaces";

interface DashboardExpirationsCardProps {
  students: ExpiringStudentDTO[];
  warningDays: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | null): string {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function DashboardExpirationsCard({
  students,
  warningDays,
}: DashboardExpirationsCardProps) {
  const [filter, setFilter] = useState<"all" | "overdue" | "upcoming">("all");

  const overdueStudents = students.filter((s) => s.isOverdue);
  const upcomingStudents = students.filter((s) => !s.isOverdue);

  const filteredStudents =
    filter === "overdue"
      ? overdueStudents
      : filter === "upcoming"
        ? upcomingStudents
        : students;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Calendar className="size-4 text-primary" />
            Vencimientos
          </CardTitle>
          <CardDescription className="text-xs">
            Cuotas vencidas y próximas a vencer en {warningDays} días
          </CardDescription>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => setFilter("all")}
          >
            Todos ({students.length})
          </Button>
          <Button
            variant={filter === "overdue" ? "destructive" : "ghost"}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => setFilter("overdue")}
          >
            Vencidos ({overdueStudents.length})
          </Button>
          <Button
            variant={filter === "upcoming" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => setFilter("upcoming")}
          >
            Próximos ({upcomingStudents.length})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        {filteredStudents.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            <AlertCircle className="size-8 text-muted-foreground/40 mb-2" />
            <p className="font-medium text-foreground">
              {filter === "overdue"
                ? "¡Excelente! No hay cuotas vencidas."
                : filter === "upcoming"
                  ? "No hay vencimientos en los próximos días."
                  : "No hay alumnos con cuotas por vencer o vencidas."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {filteredStudents.map((s) => {
              const overdueDays =
                s.daysRemaining !== null && s.daysRemaining < 0
                  ? Math.abs(s.daysRemaining)
                  : 0;

              return (
                <div
                  key={s.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/40 px-2 rounded-md transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/alumnos/${s.id}`}
                          className="font-medium text-sm hover:underline"
                        >
                          {s.firstName} {s.lastName}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          DNI {s.dni}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>Plan: {s.planName || "Sin plan"}</span>
                        <span>•</span>
                        <span>Vence: {formatDate(s.paymentExpiresAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {s.isOverdue ? (
                      <Badge variant="destructive" className="text-xs">
                        Vencido hace {overdueDays}d
                      </Badge>
                    ) : s.daysRemaining === 0 ? (
                      <Badge
                        variant="secondary"
                        className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs"
                      >
                        Vence hoy
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Vence en {s.daysRemaining}d
                      </Badge>
                    )}

                    {s.pendingBalance > 0 ? (
                      <Badge
                        variant="outline"
                        className="border-red-500/30 text-red-600 dark:text-red-400 font-mono text-xs"
                      >
                        Debe {formatCurrency(s.pendingBalance)}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-xs"
                      >
                        Al día
                      </Badge>
                    )}

                    {s.accessOverride === "allowed" && (
                      <span title="Acceso permitido por excepción">
                        <ShieldCheck className="size-4 text-blue-500" />
                      </span>
                    )}
                    {s.accessOverride === "blocked" && (
                      <span title="Acceso suspendido manualmente">
                        <ShieldX className="size-4 text-red-500" />
                      </span>
                    )}
                    {s.accessOverride === "auto" && s.isOverdue && (
                      <span title="Acceso bloqueado automáticamente por vencimiento">
                        <ShieldAlert className="size-4 text-amber-500" />
                      </span>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      render={<Link href={`/alumnos/${s.id}`} />}
                      className="size-7"
                    >
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
