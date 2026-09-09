import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GenericPasswordForm } from "@/components/admin/generic-password-form"
import { genericProfileService } from "@/lib/services/generic-profile.service"
import { GENERIC_LEVEL_LABEL, GENERIC_LEVEL_VALUES } from "@/lib/validators/generic-profile"

// Assigned templates change from this page itself — always fetch fresh.
export const dynamic = "force-dynamic"

export default async function AlumnosGenericosPage() {
  const profiles = await genericProfileService.getAll()
  const profileByLevel = new Map(profiles.map((p) => [p.level, p]))

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Alumnos genéricos</h1>
        <p className="text-muted-foreground">
          Accesos compartidos por nivel — cualquiera con la clave puede ver la rutina asignada.
        </p>
      </div>

      {GENERIC_LEVEL_VALUES.map((level) => {
        const profile = profileByLevel.get(level)
        return (
          <Card key={level}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {GENERIC_LEVEL_LABEL[level]}
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/alumnos-genericos/${level}/asignar`} />}
                >
                  {profile?.assignedTemplate ? "Cambiar rutina" : "Asignar rutina"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Rutina actual: {profile?.assignedTemplate?.name ?? "Sin asignar"}
              </p>
              <GenericPasswordForm level={level} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
