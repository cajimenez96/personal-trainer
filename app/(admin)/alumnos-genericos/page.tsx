import Link from "next/link"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GenericPasswordForm } from "@/components/admin/generic-password-form"
import { CreateGenericProfileDialog } from "@/components/admin/create-generic-profile-dialog"
import { EditGenericProfileDialog } from "@/components/admin/edit-generic-profile-dialog"
import { DeleteGenericProfileDialog } from "@/components/admin/delete-generic-profile-dialog"
import { requireCoachAuth } from "@/lib/auth"
import { genericProfileService } from "@/lib/services/generic-profile.service"
import { routineTemplateService } from "@/lib/services/routine-template.service"
import { UserCheck, ShieldAlert, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AlumnosGenericosPage() {
  const user = await requireCoachAuth()

  const [coach, profiles, templates] = await Promise.all([
    db.trainer.findUnique({
      where: { id: user.id },
      select: { maxGenericProfiles: true },
    }),
    genericProfileService.getAll(user.id),
    routineTemplateService.list(user.id),
  ])

  const maxProfiles = coach?.maxGenericProfiles ?? 3
  const isAtLimit = profiles.length >= maxProfiles

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Alumnos Genéricos</h1>
            <Badge variant={isAtLimit ? "destructive" : "secondary"} className="text-xs">
              {profiles.length} / {maxProfiles} cupos
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Accesos grupales o por nivel para el portal público. Los alumnos ingresan directamente con su clave y no necesitan registrar datos personales.
          </p>
        </div>

        <CreateGenericProfileDialog
          currentCount={profiles.length}
          maxProfiles={maxProfiles}
          templates={templates}
        />
      </div>

      {isAtLimit && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-500">
          <ShieldAlert className="size-4 shrink-0" />
          <span>
            Alcanzaste el cupo máximo de <strong>{maxProfiles}</strong> alumnos genéricos asignado a tu cuenta. Para agregar más grupos o niveles, comunicate con el administrador de la plataforma.
          </span>
        </div>
      )}

      {profiles.length === 0 ? (
        <Card className="border-dashed p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <UserCheck className="size-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No hay alumnos genéricos creados</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Creá tu primer acceso genérico (ej: &quot;Turno Mañana&quot;, &quot;Nivel Básico&quot;) para que tus alumnos puedan ver su rutina compartida con una clave.
          </p>
          <div className="mt-6">
            <CreateGenericProfileDialog
              currentCount={profiles.length}
              maxProfiles={maxProfiles}
              templates={templates}
            />
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {profiles.map((profile) => (
            <Card key={profile.id} className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold">
                      {profile.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Rutina:{" "}
                      {profile.assignedTemplate ? (
                        <span className="font-medium text-foreground">
                          {profile.assignedTemplate.name}
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground">
                          Sin asignar
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge variant={profile.assignedTemplate ? "outline" : "secondary"} className="text-[11px]">
                    {profile.assignedTemplate ? "Activo" : "Pendiente"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <GenericPasswordForm
                  idOrLevel={profile.id}
                  placeholder="Actualizar clave..."
                />

                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/alumnos-genericos/${profile.id}/asignar`} />}
                  >
                    {profile.assignedTemplate ? "Cambiar rutina" : "Asignar rutina"}
                  </Button>

                  <div className="flex items-center gap-1">
                    <EditGenericProfileDialog profile={profile} />
                    <DeleteGenericProfileDialog profile={profile} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
