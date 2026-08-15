import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DownloadCsvTemplateButton } from "@/components/admin/download-csv-template-button"
import { StudentImportRunner } from "@/components/admin/student-import-runner"
import {
  MODALIDAD_VALUES,
  NIVEL_VALUES,
  OBJETIVO_VALUES,
} from "@/lib/validators/student"

const TEMPLATE_HEADERS =
  "dni,firstName,lastName,email,phone,objetivo,nivel,modalidad,membershipStartsAt,paymentExpiresAt,healthNotes"
const TEMPLATE_EXAMPLE =
  "12345678,Juan,Pérez,juan@mail.com,+541122334455,hipertrofia,intermedio,gimnasio,2026-01-01,2026-09-01,"
const TEMPLATE_CONTENT = `${TEMPLATE_HEADERS}\n${TEMPLATE_EXAMPLE}\n`

export default function ImportarAlumnosPage() {
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
            El archivo debe ser un CSV con encabezado. Columnas obligatorias:{" "}
            <code className="rounded bg-muted px-1">dni</code>,{" "}
            <code className="rounded bg-muted px-1">firstName</code>,{" "}
            <code className="rounded bg-muted px-1">lastName</code>,{" "}
            <code className="rounded bg-muted px-1">membershipStartsAt</code>. El resto son
            opcionales — se pueden dejar vacías.
          </p>
          <div className="overflow-x-auto rounded-md border bg-muted/50 p-3">
            <code className="whitespace-pre text-xs">{TEMPLATE_CONTENT}</code>
          </div>
          <ul className="list-inside list-disc text-muted-foreground">
            <li>
              <code className="rounded bg-muted px-1">objetivo</code>:{" "}
              {OBJETIVO_VALUES.join(", ")}
            </li>
            <li>
              <code className="rounded bg-muted px-1">nivel</code>: {NIVEL_VALUES.join(", ")}
            </li>
            <li>
              <code className="rounded bg-muted px-1">modalidad</code>:{" "}
              {MODALIDAD_VALUES.join(", ")}
            </li>
            <li>
              <code className="rounded bg-muted px-1">membershipStartsAt</code> /{" "}
              <code className="rounded bg-muted px-1">paymentExpiresAt</code>: formato{" "}
              <code className="rounded bg-muted px-1">AAAA-MM-DD</code>
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
