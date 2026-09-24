import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TemplatePicker } from "@/components/admin/template-picker"
import { ConfirmGenericAssignment } from "@/components/admin/confirm-generic-assignment"
import { requireCoachAuth } from "@/lib/auth"
import { genericProfileService } from "@/lib/services/generic-profile.service"
import { routineTemplateService } from "@/lib/services/routine-template.service"
import { genericLevelSchema } from "@/lib/validators/generic-profile"

export const dynamic = "force-dynamic"

export default async function AsignarRutinaGenericaPage({
  params,
  searchParams,
}: {
  params: Promise<{ level: string }>
  searchParams: Promise<{ template?: string }>
}) {
  const user = await requireCoachAuth()
  const { level: rawIdOrLevel } = await params
  const { template: templateId } = await searchParams

  let profile = await genericProfileService.getById(rawIdOrLevel, user.id)
  if (!profile) {
    const parsed = genericLevelSchema.safeParse(rawIdOrLevel)
    if (parsed.success) {
      profile = await genericProfileService.getByLevel(parsed.data, user.id)
    }
  }

  if (!profile) notFound()

  const displayName = profile.name

  if (!templateId) {
    const templates = await routineTemplateService.list(user.id)

    return (
      <div className="mx-auto max-w-4xl">
        <Button
          variant="link"
          render={<Link href="/alumnos-genericos" />}
          className="mb-2 h-auto px-0"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Button>
        <h1 className="mb-2 text-2xl font-semibold">
          Asignar rutina a {displayName}
        </h1>
        <p className="mb-6 text-muted-foreground">Elegí una plantilla del catálogo.</p>
        <TemplatePicker
          templates={templates}
          hrefForTemplate={(id) =>
            `/alumnos-genericos/${rawIdOrLevel}/asignar?template=${id}`
          }
        />
      </div>
    )
  }

  const template = await routineTemplateService.getById(templateId)
  if (!template || template.trainerId !== user.id) notFound()

  return (
    <div className="mx-auto max-w-md">
      <Button
        variant="link"
        render={<Link href={`/alumnos-genericos/${rawIdOrLevel}/asignar`} />}
        className="mb-2 h-auto px-0"
      >
        <ArrowLeft className="size-4" />
        Elegir otra plantilla
      </Button>
      <h1 className="mb-4 text-2xl font-semibold">
        Asignar rutina a {displayName}
      </h1>
      <ConfirmGenericAssignment
        profileId={profile.id}
        profileName={displayName}
        templateId={template.id}
        templateName={template.name}
      />
    </div>
  )
}
