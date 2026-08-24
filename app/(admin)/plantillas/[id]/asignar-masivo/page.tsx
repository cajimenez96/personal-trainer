import Link from "next/link"
import { notFound } from "next/navigation"
import { z } from "zod"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FilterSelect } from "@/components/admin/filter-select"
import { StudentSelectionTable } from "@/components/admin/student-selection-table"
import { routineTemplateService } from "@/lib/services/routine-template.service"
import { studentService } from "@/lib/services/student.service"
import { objetivoService } from "@/lib/services/objetivo.service"
import { modalidadService } from "@/lib/services/modalidad.service"
import { NIVEL_LABEL, NIVEL_VALUES } from "@/lib/validators/student"

// DB-backed: template + filtered student preview must be fresh on every visit.
export const dynamic = "force-dynamic"

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v

const filtersSchema = z.object({
  objetivoId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  nivel: z.preprocess(emptyToUndefined, z.enum(NIVEL_VALUES).optional()),
  modalidadId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  paymentExpired: z.preprocess(emptyToUndefined, z.enum(["true"]).optional()),
})

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-AR").format(date)
}

export default async function AsignacionMasivaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { id } = await params
  const raw = await searchParams
  const parsed = filtersSchema.safeParse(raw)
  const filters = parsed.success ? parsed.data : {}

  const [template, objetivos, modalidades] = await Promise.all([
    routineTemplateService.getById(id),
    objetivoService.list(),
    modalidadService.list(),
  ])
  if (!template) notFound()

  const students = await studentService.listAllActive({
    ...filters,
    paymentExpired: filters.paymentExpired === "true",
  })
  const now = Date.now()

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-6">
      <div>
        <Button
          variant="link"
          render={<Link href={`/plantillas/${template.id}`} />}
          className="mb-2 h-auto px-0"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Button>
        <h1 className="text-2xl font-semibold">Asignación masiva</h1>
        <p className="text-muted-foreground">Plantilla: {template.name}</p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <FilterSelect
          name="objetivoId"
          label="Objetivo"
          value={filters.objetivoId}
          items={objetivos.map((o) => ({ value: o.id, label: o.label }))}
        />
        <FilterSelect
          name="nivel"
          label="Nivel"
          value={filters.nivel}
          items={NIVEL_VALUES.map((v) => ({ value: v, label: NIVEL_LABEL[v] }))}
        />
        <FilterSelect
          name="modalidadId"
          label="Modalidad"
          value={filters.modalidadId}
          items={modalidades.map((m) => ({ value: m.id, label: m.label }))}
        />
        <label className="flex h-9 items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="paymentExpired"
            value="true"
            defaultChecked={filters.paymentExpired === "true"}
          />
          Solo cuota vencida
        </label>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      <StudentSelectionTable
        templateId={template.id}
        templateName={template.name}
        students={students.map((s) => ({
          id: s.id,
          name: `${s.lastName}, ${s.firstName}`,
          dni: s.dni,
          paymentExpiresAt: s.paymentExpiresAt ? formatDate(s.paymentExpiresAt) : null,
          paymentExpired: s.paymentExpiresAt ? s.paymentExpiresAt.getTime() < now : false,
        }))}
      />
    </div>
  )
}
