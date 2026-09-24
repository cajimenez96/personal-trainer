import { notFound, redirect } from "next/navigation"
import { genericProfileService } from "@/lib/services/generic-profile.service"
import { routineTemplateService } from "@/lib/services/routine-template.service"
import { exerciseService } from "@/lib/services/exercise.service"
import { mapTemplateToRoutineDays } from "@/lib/mappers/template-routine.mapper"
import { genericLevelSchema } from "@/lib/validators/generic-profile"
import { getTrainerBySlug } from "@/lib/tenant"
import { RoutinePortalHeader } from "@/components/portal/routine-portal-header"
import { RoutineDayAccordion } from "@/components/portal/routine-day-accordion"
import { NoRoutineAssignedMessage } from "@/components/portal/no-routine-assigned-message"

export const dynamic = "force-dynamic"

export default async function CoachRutinaGenericaPage({
  params,
}: {
  params: Promise<{ coachSlug: string; level: string }>
}) {
  const { coachSlug, level: rawIdOrLevel } = await params

  const coach = await getTrainerBySlug(coachSlug)
  if (!coach || !coach.isActive) {
    notFound()
  }

  // Buscar primero por ID del perfil, o fallback por nivel histórico
  let profile = await genericProfileService.getById(rawIdOrLevel, coach.id)
  if (!profile) {
    const parsed = genericLevelSchema.safeParse(rawIdOrLevel)
    if (parsed.success) {
      profile = await genericProfileService.getByLevel(parsed.data, coach.id)
    }
  }

  if (!profile) redirect(`/${coachSlug}?error=not-found`)

  const displayName = profile.name

  if (!profile.assignedTemplateId) {
    return (
      <NoRoutineAssignedMessage
        greetingName={displayName}
        backHref={`/${coachSlug}`}
        backLabel="Volver al inicio"
      />
    )
  }

  const [template, exercises] = await Promise.all([
    routineTemplateService.getById(profile.assignedTemplateId),
    exerciseService.list({}),
  ])
  if (!template) redirect(`/${coachSlug}?error=not-found`)

  const exerciseById = new Map(exercises.map((e) => [e.id, { name: e.name, videoUrl: e.videoUrl }]))
  const days = mapTemplateToRoutineDays(template, exerciseById)

  return (
    <div className="min-h-screen bg-[#0d0d0d] pb-12 text-foreground">
      <RoutinePortalHeader greetingLabel="Hola," title={displayName} subtitle={template.name} />

      <main className="flex flex-col gap-3 px-3 py-4 sm:px-4">
        {days.length === 0 && (
          <p className="text-center text-muted-foreground">
            Esta rutina todavía no tiene días cargados.
          </p>
        )}
        <RoutineDayAccordion days={days} />
      </main>
    </div>
  )
}
