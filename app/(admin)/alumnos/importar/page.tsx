import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DownloadCsvTemplateButton } from "@/components/admin/download-csv-template-button"
import { StudentImportRunner } from "@/components/admin/student-import-runner"
import { objetivoService } from "@/lib/services/objetivo.service"
import { modalidadService } from "@/lib/services/modalidad.service"
import { NIVEL_VALUES } from "@/lib/validators/student"

const TEMPLATE_HEADERS =
  "dni,nombre,apellido,email,telefono,objetivo,nivel,modalidad,fecha_inicio_membresia,fecha_vencimiento_cuota,notas_salud"
const TEMPLATE_EXAMPLE =
  "12345678,Juan,Pérez,juan@mail.com,+541122334455,Hipertrofia,intermedio,Gimnasio,01-01-2026,01-09-2026,"
const TEMPLATE_CONTENT = `${TEMPLATE_HEADERS}\n${TEMPLATE_EXAMPLE}\n`

export const dynamic = "force-dynamic"

export default async function ImportarAlumnosPage() {
  const [objetivos, modalidades] = await Promise.all([
    objetivoService.list(),
    modalidadService.list(),
  ])

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Importar alumnos desde CSV</h1>
        <Button variant="outline" render={<Link href="/alumnos" />}>
          Volver al listado
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formato esperado</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p>
            El archivo debe ser un CSV con encabezado, columnas en español. Obligatorias:{" "}
            <code className="rounded bg-muted px-1">dni</code>,{" "}
            <code className="rounded bg-muted px-1">nombre</code>,{" "}
            <code className="rounded bg-muted px-1">apellido</code>,{" "}
            <code className="rounded bg-muted px-1">fecha_inicio_membresia</code>. El resto son
            opcionales — se pueden dejar vacías.
          </p>
          <div className="overflow-x-auto rounded-md border bg-muted/50 p-3">
            <code className="whitespace-pre text-xs">{TEMPLATE_CONTENT}</code>
          </div>
          <ul className="list-inside list-disc text-muted-foreground">
            <li>
              <code className="rounded bg-muted px-1">objetivo</code>: debe coincidir
              exactamente con una opción cargada en el dashboard — actualmente{" "}
              {objetivos.length > 0
                ? objetivos.map((o) => o.label).join(", ")
                : "no hay ninguna cargada"}
            </li>
            <li>
              <code className="rounded bg-muted px-1">nivel</code>: {NIVEL_VALUES.join(", ")}
            </li>
            <li>
              <code className="rounded bg-muted px-1">modalidad</code>: debe coincidir
              exactamente con una opción cargada en el dashboard — actualmente{" "}
              {modalidades.length > 0
                ? modalidades.map((m) => m.label).join(", ")
                : "no hay ninguna cargada"}
            </li>
            <li>
              <code className="rounded bg-muted px-1">fecha_inicio_membresia</code> /{" "}
              <code className="rounded bg-muted px-1">fecha_vencimiento_cuota</code>: formato{" "}
              <code className="rounded bg-muted px-1">DD-MM-AAAA</code> (ej.{" "}
              <code className="rounded bg-muted px-1">15-08-2026</code>)
            </li>
          </ul>
          <DownloadCsvTemplateButton
            filename="plantilla-alumnos.csv"
            content={TEMPLATE_CONTENT}
            label="Descargar plantilla"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Archivo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            El archivo completo se valida antes de importar cualquier fila — si hay errores, no se
            importa nada.
          </p>
          <StudentImportRunner />
        </CardContent>
      </Card>
    </div>
  )
}
