import Link from "next/link";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadCsvTemplateButton } from "@/components/admin/download-csv-template-button";
import { RoutineImportRunner } from "@/components/admin/routine-import-runner";

const TEMPLATE_HEADERS =
  "templateName,templateDescription,durationWeeks,dayLabel,dayOrder,exerciseName,primaryMuscle,secondaryMuscle,videoUrl,sets,reps,repsScheme,weightKg,intensity,tempo,durationSecs,restSecs,trainerNotes,groupLabel,groupRestSecs,blockOrder,studentDni";
const TEMPLATE_EXAMPLE = [
  "Torso/Pierna 4 días,Plantilla de fuerza general,6,Día 1 - Torso,1,Press banca,pecho,tríceps,,4,8,,90,@7,3-1-1-0,,90,,,,1,",
  "Torso/Pierna 4 días,,,Día 1 - Torso,1,Remo con barra,espalda,bíceps,,4,10,,,,,,90,,,,2,",
  "Torso/Pierna 4 días,,,Día 2 - Pierna,2,Sentadilla,cuádriceps,glúteos,,4,,1x6 2x5 1x4,130,@7,,,120,,,,1,12345678",
  "Torso/Pierna 4 días,,,Día 2 - Pierna,2,Curl femoral,isquiotibiales,,,3,12,,,,,,0,,A,60,2,",
  "Torso/Pierna 4 días,,,Día 2 - Pierna,2,Extensión de cuádriceps,cuádriceps,,,3,12,,,,,,90,,A,60,3,",
].join("\n");
const TEMPLATE_CONTENT = `${TEMPLATE_HEADERS}\n${TEMPLATE_EXAMPLE}\n`;

// La tabla de ayuda se deriva del mismo TEMPLATE_CONTENT que se descarga (parseado,
// no separado a mano por comas) para que nunca queden desincronizados.
const { data: TEMPLATE_TABLE_ROWS } = Papa.parse<string[]>(
  TEMPLATE_CONTENT.trim(),
  {
    skipEmptyLines: true,
  },
);
const [TEMPLATE_TABLE_HEADER, ...TEMPLATE_TABLE_DATA] = TEMPLATE_TABLE_ROWS;

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
            Cada fila es{" "}
            <strong>un ejercicio dentro de un día de una plantilla</strong>.
            Varias filas con el mismo{" "}
            <code className="rounded bg-muted px-1">templateName</code> forman
            la misma plantilla; varias con el mismo{" "}
            <code className="rounded bg-muted px-1">dayLabel</code> dentro de
            esa plantilla forman el mismo día.
          </p>
          <div className="overflow-x-auto rounded-md border bg-muted/50">
            <table className="text-xs">
              <thead>
                <tr>
                  {TEMPLATE_TABLE_HEADER.map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap border-b px-2 py-1.5 text-left font-mono font-medium"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TEMPLATE_TABLE_DATA.map((row, i) => (
                  <tr key={i} className="border-t border-border/50">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="whitespace-nowrap px-2 py-1.5 font-mono text-muted-foreground"
                      >
                        {cell || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="list-inside list-disc text-muted-foreground">
            <li>
              Obligatorias en toda fila:{" "}
              <code className="rounded bg-muted px-1">templateName</code>,{" "}
              <code className="rounded bg-muted px-1">dayLabel</code>,{" "}
              <code className="rounded bg-muted px-1">dayOrder</code>,{" "}
              <code className="rounded bg-muted px-1">exerciseName</code>,{" "}
              <code className="rounded bg-muted px-1">sets</code>,{" "}
              <code className="rounded bg-muted px-1">blockOrder</code>
            </li>
            <li>
              <code className="rounded bg-muted px-1">primaryMuscle</code> es
              obligatorio solo si{" "}
              <code className="rounded bg-muted px-1">exerciseName</code> no
              existe todavía en el catálogo — si ya existe, se reutiliza el
              ejercicio y estas columnas se ignoran
            </li>
            <li>
              <code className="rounded bg-muted px-1">durationWeeks</code>{" "}
              (mínimo 2, RN-01) y{" "}
              <code className="rounded bg-muted px-1">templateDescription</code>{" "}
              solo hacen falta en una fila de la plantilla — las demás pueden
              dejarse vacías
            </li>
            <li>
              <code className="rounded bg-muted px-1">studentDni</code>{" "}
              (opcional): si se completa, la plantilla se asigna a ese alumno al
              finalizar la importación. Debe existir un alumno activo con ese
              DNI
            </li>
            <li>
              <code className="rounded bg-muted px-1">reps</code> (opcional): un
              número entero fijo por serie, ej.{" "}
              <code className="rounded bg-muted px-1">8</code>. No admite rangos
              (<code className="rounded bg-muted px-1">8-10</code>) — para eso
              dejalo vacío y usá{" "}
              <code className="rounded bg-muted px-1">repsScheme</code>
            </li>
            <li>
              <code className="rounded bg-muted px-1">repsScheme</code>{" "}
              (opcional): esquema de reps variable por serie, ej.{" "}
              <code className="rounded bg-muted px-1">1x6 2x5 1x4</code> — si se
              completa, se muestra en vez de{" "}
              <code className="rounded bg-muted px-1">reps</code>
            </li>
            <li>
              <code className="rounded bg-muted px-1">weightKg</code> (opcional)
              e <code className="rounded bg-muted px-1">intensity</code>{" "}
              (opcional, texto libre tipo{" "}
              <code className="rounded bg-muted px-1">@7</code>): peso e
              intensidad prescritos
            </li>
            <li>
              <code className="rounded bg-muted px-1">tempo</code> (opcional,
              ej. <code className="rounded bg-muted px-1">3-1-1-0</code> o{" "}
              <code className="rounded bg-muted px-1">controlado</code>): ritmo
              de ejecución
            </li>
            <li>
              <code className="rounded bg-muted px-1">groupLabel</code>{" "}
              (opcional, ej. <code className="rounded bg-muted px-1">A</code>):
              agrupa en una superserie/circuito las filas consecutivas de un
              mismo día que comparten la misma etiqueta.{" "}
              <code className="rounded bg-muted px-1">groupRestSecs</code> es el
              descanso al terminar el bloque completo (distinto de{" "}
              <code className="rounded bg-muted px-1">restSecs</code>, que es
              por ejercicio)
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
            El archivo completo se valida antes de importar cualquier fila — si
            hay errores, no se importa nada.
          </p>
          <RoutineImportRunner />
        </CardContent>
      </Card>
    </div>
  );
}
