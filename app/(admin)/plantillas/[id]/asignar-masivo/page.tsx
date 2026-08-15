import { notFound } from "next/navigation"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { BulkAssignRunner } from "@/components/admin/bulk-assign-runner"
import { routineTemplateService } from "@/lib/services/routine-template.service"
import { studentService } from "@/lib/services/student.service"
import {
  MODALIDAD_LABEL,
  MODALIDAD_VALUES,
  NIVEL_LABEL,
  NIVEL_VALUES,
  OBJETIVO_LABEL,
  OBJETIVO_VALUES,
} from "@/lib/validators/student"

// DB-backed: template + filtered student preview must be fresh on every visit.
export const dynamic = "force-dynamic"

const filtersSchema = z.object({
  objetivo: z.enum(OBJETIVO_VALUES).optional(),
  nivel: z.enum(NIVEL_VALUES).optional(),
  modalidad: z.enum(MODALIDAD_VALUES).optional(),
})

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

  const template = await routineTemplateService.getById(id)
  if (!template) notFound()

  const students = await studentService.listAllActive(filters)

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Asignación masiva</h1>
        <p className="text-muted-foreground">Plantilla: {template.name}</p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <FilterSelect
          name="objetivo"
          label="Objetivo"
          value={filters.objetivo}
          options={OBJETIVO_VALUES}
          labels={OBJETIVO_LABEL}
        />
        <FilterSelect
          name="nivel"
          label="Nivel"
          value={filters.nivel}
          options={NIVEL_VALUES}
          labels={NIVEL_LABEL}
        />
        <FilterSelect
          name="modalidad"
          label="Modalidad"
          value={filters.modalidad}
          options={MODALIDAD_VALUES}
          labels={MODALIDAD_LABEL}
        />
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      <div className="rounded-md border p-4">
        <p className="mb-2 font-medium">{students.length} alumno(s) coinciden con el filtro</p>
        {students.length > 0 && (
          <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto text-sm text-muted-foreground">
            {students.map((s) => (
              <li key={s.id}>
                {s.lastName}, {s.firstName}
              </li>
            ))}
          </ul>
        )}
      </div>

      <BulkAssignRunner
        templateId={template.id}
        templateName={template.name}
        students={students.map((s) => ({ id: s.id, name: `${s.lastName}, ${s.firstName}` }))}
      />
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
