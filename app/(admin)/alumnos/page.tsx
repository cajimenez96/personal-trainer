import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FlashToast } from "@/components/admin/flash-toast";
import { ClickableTableRow } from "@/components/admin/clickable-table-row";
import { ActionsCell } from "@/components/admin/actions-cell";
import { StudentRowActions } from "@/components/admin/student-row-actions";
import { FilterSelect } from "@/components/admin/filter-select";
import { studentService } from "@/lib/services/student.service";
import { objetivoService } from "@/lib/services/objetivo.service";
import { modalidadService } from "@/lib/services/modalidad.service";
import { planService } from "@/lib/services/plan.service";
import {
  NIVEL_LABEL,
  NIVEL_VALUES,
  studentListQuerySchema,
} from "@/lib/validators/student";

const PAGE_SIZE = 20;

function isExpired(date: Date | null) {
  if (!date) return false;
  return date.getTime() < Date.now();
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-AR").format(date);
}

export default async function AlumnosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = studentListQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : { isActive: true as const };

  const [{ items, nextCursor }, objetivos, modalidades, plans] =
    await Promise.all([
      studentService.list({ ...query, limit: PAGE_SIZE }),
      objetivoService.list(),
      modalidadService.list(),
      planService.list(true),
    ]);

  const baseParams = new URLSearchParams();
  if (query.search) baseParams.set("search", query.search);
  if (query.objetivoId) baseParams.set("objetivoId", query.objetivoId);
  if (query.nivel) baseParams.set("nivel", query.nivel);
  if (query.modalidadId) baseParams.set("modalidadId", query.modalidadId);
  if (query.planId) baseParams.set("planId", query.planId);
  baseParams.set("isActive", String(query.isActive));

  const nextHref = (() => {
    const params = new URLSearchParams(baseParams);
    if (nextCursor) params.set("cursor", nextCursor);
    return `/alumnos?${params.toString()}`;
  })();

  return (
    <div className="flex flex-col gap-6">
      <Suspense>
        <FlashToast
          messages={{
            created: "Alumno creado correctamente.",
            updated: "Alumno actualizado correctamente.",
            deactivated: "Alumno desactivado.",
          }}
        />
      </Suspense>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Alumnos</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href="/alumnos/importar" />}>
            Importar CSV
          </Button>
          <Button render={<Link href="/alumnos/nuevo" />}>Nuevo alumno</Button>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex w-full flex-col gap-1 sm:w-56">
          <label htmlFor="search" className="text-sm text-muted-foreground">
            Buscar
          </label>
          <Input
            id="search"
            name="search"
            placeholder="Nombre o DNI"
            defaultValue={query.search ?? ""}
            className="w-full"
          />
        </div>

        <FilterSelect
          name="planId"
          label="Plan"
          value={query.planId}
          items={plans.map((p) => ({ value: p.id, label: p.name }))}
        />
        <FilterSelect
          name="objetivoId"
          label="Objetivo"
          value={query.objetivoId}
          items={objetivos.map((o) => ({ value: o.id, label: o.label }))}
        />
        <FilterSelect
          name="nivel"
          label="Nivel"
          value={query.nivel}
          items={NIVEL_VALUES.map((v) => ({ value: v, label: NIVEL_LABEL[v] }))}
        />
        <FilterSelect
          name="modalidadId"
          label="Modalidad"
          value={query.modalidadId}
          items={modalidades.map((m) => ({ value: m.id, label: m.label }))}
        />
        <FilterSelect
          name="isActive"
          label="Estado"
          value={String(query.isActive)}
          items={[
            { value: "true", label: "Activos" },
            { value: "false", label: "Inactivos" },
          ]}
        />

        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Objetivo</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Cuota</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No se encontraron alumnos.
                </TableCell>
              </TableRow>
            )}
            {items.map((student) => {
              const latestPlan = student.subscriptions?.[0]?.plan;
              return (
                <ClickableTableRow
                  key={student.id}
                  href={`/alumnos/${student.id}`}
                >
                  <TableCell>
                    <Link
                      href={`/alumnos/${student.id}`}
                      className="hover:underline font-medium"
                    >
                      {student.lastName}, {student.firstName}
                    </Link>
                  </TableCell>
                  <TableCell>{student.dni}</TableCell>
                  <TableCell>
                    {latestPlan ? (
                      <Badge variant="outline" className="font-normal text-xs">
                        {latestPlan.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>{student.objetivoRef?.label ?? "—"}</TableCell>
                  <TableCell>
                    {student.nivel ? NIVEL_LABEL[student.nivel] : "—"}
                  </TableCell>
                  <TableCell>
                    {student.paymentExpiresAt ? (
                      <Badge
                        variant={
                          isExpired(student.paymentExpiresAt)
                            ? "destructive"
                            : "success"
                        }
                      >
                        {formatDate(student.paymentExpiresAt)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <ActionsCell>
                    <StudentRowActions
                      studentId={student.id}
                      studentName={`${student.firstName} ${student.lastName}`}
                      isActive={student.isActive}
                    />
                  </ActionsCell>
                </ClickableTableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {nextCursor && (
        <div className="flex justify-end">
          <Button render={<Link href={nextHref} />} variant="outline">
            Página siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
