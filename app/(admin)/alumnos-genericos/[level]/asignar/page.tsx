import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TemplatePicker } from "@/components/admin/template-picker"
import { ConfirmGenericAssignment } from "@/components/admin/confirm-generic-assignment"
import { requireCoachAuth } from "@/lib/auth"
import { genericProfileService } from "@/lib/services/generic-profile.service"
import { routineTemplateService } from "@/lib/services/routine-template.service"
import { GENERIC_LEVEL_LABEL, genericLevelSchema } from "@/lib/validators/generic-profile"

// DB-backed: profile + template catalog must be fresh on every visit.
export const dynamic = "force-dynamic"

export default async function AsignarRutinaGenericaPage({
  params,
  searchParams,
}: {
  params: Promise<{ level: string }>
  searchParams: Promise<{ template?: string }>
}) {
  const user = await requireCoachAuth()
  const { level: rawLevel } = await params
  const { template: templateId } = await searchParams
  const parsed = genericLevelSchema.safeParse(rawLevel)
  if (!parsed.success) notFound()

  const profile = await genericProfileService.getByLevel(parsed.data, user.id)
  if (!profile) notFound()

  const levelLabel = GENERIC_LEVEL_LABEL[parsed.data]

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
        <h1 className="mb-2 text-2xl font-semibold">Asignar rutina a {levelLabel}</h1>
        <p className="mb-6 text-muted-foreground">Elegí una plantilla del catálogo.</p>
        <TemplatePicker
          templates={templates}
          hrefForTemplate={(id) => `/alumnos-genericos/${parsed.data}/asignar?template=${id}`}
        />
      </div>
    )
  }

  const template = await routineTemplateService.getById(templateId)
  if (!template || template.trainerId !== user.id) notFound()

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-2xl font-semibold">Asignar rutina a {levelLabel}</h1>
      <ConfirmGenericAssignment level={parsed.data} templateId={template.id} templateName={template.name} />
    </div>
  )
}
