import Link from "next/link"
import { Suspense } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FlashToast } from "@/components/admin/flash-toast"
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Plantillas</h1>
        <div className="flex gap-2">
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
          <Link key={template.id} href={`/plantillas/${template.id}`}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {template.name}
                  <Badge variant="secondary">{template.durationWeeks} sem.</Badge>
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
          </Link>
        ))}
      </div>
    </div>
  )
}
