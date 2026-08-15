import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DownloadCsvTemplateButton } from "@/components/admin/download-csv-template-button"
import { RoutineImportRunner } from "@/components/admin/routine-import-runner"

const TEMPLATE_HEADERS =
  "templateName,templateDescription,durationWeeks,dayLabel,dayOrder,exerciseName,primaryMuscle,secondaryMuscle,videoUrl,sets,reps,durationSecs,restSecs,trainerNotes,blockOrder,studentDni"
const TEMPLATE_EXAMPLE = [
  "Torso/Pierna 4 días,Plantilla de fuerza general,6,Día 1 - Torso,1,Press banca,pecho,tríceps,,4,8,,90,,1,",
  "Torso/Pierna 4 días,,,Día 1 - Torso,1,Remo con barra,espalda,bíceps,,4,10,,90,,2,",
  "Torso/Pierna 4 días,,,Día 2 - Pierna,2,Sentadilla,cuádriceps,glúteos,,4,8,,120,,1,12345678",
].join("\n")
const TEMPLATE_CONTENT = `${TEMPLATE_HEADERS}\n${TEMPLATE_EXAMPLE}\n`

export default function ImportarRutinasPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Importar rutinas desde CSV</h1>
        <Button variant="outline" render={<Link href="/plantillas" />}>
          Volver al listado
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formato esperado</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p>
            Cada fila es <strong>un ejercicio dentro de un día de una plantilla</strong>. Varias
            filas con el mismo <code className="rounded bg-muted px-1">templateName</code> forman
            la misma plantilla; varias con el mismo{" "}
            <code className="rounded bg-muted px-1">dayLabel</code> dentro de esa plantilla forman
            el mismo día.
          </p>
          <div className="overflow-x-auto rounded-md border bg-muted/50 p-3">
            <code className="whitespace-pre text-xs">{TEMPLATE_CONTENT}</code>
          </div>
          <ul className="list-inside list-disc text-muted-foreground">
            <li>
              Obligatorias en toda fila: <code className="rounded bg-muted px-1">templateName</code>,{" "}
              <code className="rounded bg-muted px-1">dayLabel</code>,{" "}
              <code className="rounded bg-muted px-1">dayOrder</code>,{" "}
              <code className="rounded bg-muted px-1">exerciseName</code>,{" "}
              <code className="rounded bg-muted px-1">sets</code>,{" "}
              <code className="rounded bg-muted px-1">blockOrder</code>
            </li>
            <li>
              <code className="rounded bg-muted px-1">primaryMuscle</code> es obligatorio solo si{" "}
              <code className="rounded bg-muted px-1">exerciseName</code> no existe todavía en el
              catálogo — si ya existe, se reutiliza el ejercicio y estas columnas se ignoran
            </li>
            <li>
              <code className="rounded bg-muted px-1">durationWeeks</code> (mínimo 2, RN-01) y{" "}
              <code className="rounded bg-muted px-1">templateDescription</code> solo hacen falta
              en una fila de la plantilla — las demás pueden dejarse vacías
            </li>
            <li>
              <code className="rounded bg-muted px-1">studentDni</code> (opcional): si se completa,
              la plantilla se asigna a ese alumno al finalizar la importación. Debe existir un
              alumno activo con ese DNI
            </li>
          </ul>
          <DownloadCsvTemplateButton
            filename="plantilla-rutinas.csv"
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
          <RoutineImportRunner />
        </CardContent>
      </Card>
    </div>
  )
}
