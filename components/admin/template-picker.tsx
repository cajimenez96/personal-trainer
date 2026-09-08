import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { RoutineTemplateWithDays } from "@/lib/repositories/interfaces"

export function TemplatePicker({
  templates,
  hrefForTemplate,
}: {
  templates: RoutineTemplateWithDays[]
  hrefForTemplate: (templateId: string) => string
}) {
  if (templates.length === 0) {
    return <p className="text-muted-foreground">No hay plantillas creadas todavía.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((t) => (
        <Link key={t.id} href={hrefForTemplate(t.id)}>
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t.name}
                <Badge variant="secondary">{t.durationWeeks} sem.</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {t.trainingDays.length} día(s) ·{" "}
                {t.trainingDays.reduce((sum, d) => sum + d.exerciseBlocks.length, 0)} ejercicio(s)
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
