import Link from "next/link"
import { Suspense } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FlashToast } from "@/components/admin/flash-toast"
import { studentService } from "@/lib/services/student.service"
import {
  MODALIDAD_LABEL,
  MODALIDAD_VALUES,
  NIVEL_LABEL,
  NIVEL_VALUES,
  OBJETIVO_LABEL,
  OBJETIVO_VALUES,
  studentListQuerySchema,
} from "@/lib/validators/student"

const PAGE_SIZE = 20

function isExpired(date: Date | null) {
  if (!date) return false
  return date.getTime() < Date.now()
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-AR").format(date)
}

export default async function AlumnosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const raw = await searchParams
  const parsed = studentListQuerySchema.safeParse(raw)
  const query = parsed.success ? parsed.data : { isActive: true as const }

  const { items, nextCursor } = await studentService.list({
    ...query,
    limit: PAGE_SIZE,
  })

  const baseParams = new URLSearchParams()
  if (query.search) baseParams.set("search", query.search)
  if (query.objetivo) baseParams.set("objetivo", query.objetivo)
  if (query.nivel) baseParams.set("nivel", query.nivel)
  if (query.modalidad) baseParams.set("modalidad", query.modalidad)
  baseParams.set("isActive", String(query.isActive))

  const nextHref = (() => {
    const params = new URLSearchParams(baseParams)
    if (nextCursor) params.set("cursor", nextCursor)
    return `/alumnos?${params.toString()}`
  })()

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Alumnos</h1>
        <Button render={<Link href="/alumnos/nuevo" />}>Nuevo alumno</Button>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1">
          <label htmlFor="search" className="text-sm text-muted-foreground">
            Buscar
          </label>
          <Input
            id="search"
            name="search"
            placeholder="Nombre o DNI"
            defaultValue={query.search ?? ""}
            className="w-56"
          />
        </div>

        <FilterSelect
          name="objetivo"
          label="Objetivo"
          value={query.objetivo}
          options={OBJETIVO_VALUES}
          labels={OBJETIVO_LABEL}
        />
        <FilterSelect
          name="nivel"
          label="Nivel"
          value={query.nivel}
          options={NIVEL_VALUES}
          labels={NIVEL_LABEL}
        />
        <FilterSelect
          name="modalidad"
          label="Modalidad"
          value={query.modalidad}
          options={MODALIDAD_VALUES}
          labels={MODALIDAD_LABEL}
        />
        <FilterSelect
          name="isActive"
          label="Estado"
          value={String(query.isActive)}
          options={["true", "false"]}
          labels={{ true: "Activos", false: "Inactivos" }}
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
              <TableHead>Objetivo</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Cuota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No se encontraron alumnos.
                </TableCell>
              </TableRow>
            )}
            {items.map((student) => (
              <TableRow key={student.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/alumnos/${student.id}`} className="hover:underline">
                    {student.lastName}, {student.firstName}
                  </Link>
                </TableCell>
                <TableCell>{student.dni}</TableCell>
                <TableCell>
                  {student.objetivo ? OBJETIVO_LABEL[student.objetivo] : "—"}
                </TableCell>
                <TableCell>{student.nivel ? NIVEL_LABEL[student.nivel] : "—"}</TableCell>
                <TableCell>
                  {student.paymentExpiresAt ? (
                    <Badge variant={isExpired(student.paymentExpiresAt) ? "destructive" : "secondary"}>
                      {formatDate(student.paymentExpiresAt)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
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
  )
}

function FilterSelect({
  name,
  label,
  value,
  options,
  labels,
}: {
  name: string
  label: string
  value: string | undefined
  options: readonly string[]
  labels: Record<string, string>
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      {/* Native select posted via the surrounding GET form — no client JS needed */}
      <select
        name={name}
        defaultValue={value ?? ""}
        className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
    </div>
  )
}
