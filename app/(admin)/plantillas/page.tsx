import Link from "next/link"
import { Suspense } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FlashToast } from "@/components/admin/flash-toast"
import { DeleteTemplateButton } from "@/components/admin/delete-template-button"
import { routineTemplateService } from "@/lib/services/routine-template.service"

// DB-backed listing — must reflect newly created templates on every request.
export const dynamic = "force-dynamic"

export default async function PlantillasPage() {
  const templates = await routineTemplateService.list()

  return (
    <div className="flex flex-col gap-6">
      <Suspense>
        <FlashToast
          messages={{
            created: "Plantilla creada correctamente.",
            updated: "Plantilla actualizada correctamente.",
            duplicated: "Plantilla duplicada correctamente.",
          }}
        />
      </Suspense>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Plantillas</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href="/plantillas/importar" />}>
            Importar CSV
          </Button>
          <Button render={<Link href="/plantillas/nuevo" />}>Nueva plantilla</Button>
        </div>
      </div>

      {templates.length === 0 && (
        <p className="text-muted-foreground">No hay plantillas creadas todavía.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="relative h-full transition-colors hover:bg-muted/50">
            {/* "Stretched link": ocupa toda la card salvo lo que tenga su propio
                z-index (el botón de eliminar) — evita anidar un <button> dentro
                de un <a>, que no es HTML válido. */}
            <Link
              href={`/plantillas/${template.id}`}
              className="absolute inset-0"
              aria-label={`Ver ${template.name}`}
            />
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{template.name}</span>
                <div className="relative z-10 flex items-center gap-1">
                  <Badge variant="secondary">{template.durationWeeks} sem.</Badge>
                  <DeleteTemplateButton templateId={template.id} templateName={template.name} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {template.description && (
                <p className="mb-2 text-sm text-muted-foreground">{template.description}</p>
              )}
              <p className="text-sm">
                {template.trainingDays.length} día(s) ·{" "}
                {template.trainingDays.reduce((sum, d) => sum + d.exerciseBlocks.length, 0)}{" "}
                ejercicio(s)
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
