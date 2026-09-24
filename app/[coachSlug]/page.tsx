import Image from "next/image"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { studentService } from "@/lib/services/student.service"
import { genericProfileService } from "@/lib/services/generic-profile.service"
import { evaluateStudentAccess } from "@/lib/utils/student-access"
import { dniSchema } from "@/lib/validators/portal"
import { getTrainerBySlug } from "@/lib/tenant"
import { siteConfig } from "@/lib/config/site"

const ERROR_MESSAGES: Record<string, string> = {
  "not-found":
    "No encontramos un alumno activo con ese DNI, ni una clave válida. Consultá con tu entrenador.",
  expired:
    "Tu acceso está pausado por cuota vencida. Ponete en contacto con tu entrenador para renovar tu plan.",
  blocked:
    "El acceso a tu rutina se encuentra suspendido por el entrenador. Consultá con él para más información.",
}

export default async function CoachPortalHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ coachSlug: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { coachSlug } = await params
  const { error } = await searchParams

  const coach = await getTrainerBySlug(coachSlug)
  if (!coach || !coach.isActive) {
    notFound()
  }

  const coachId = coach.id
  const logoSrc = coach.logoUrl || siteConfig.branding.logoHome
  const headline = coach.headline || siteConfig.trainer.headline
  const tagline = coach.tagline || siteConfig.trainer.tagline
  const brandName = coach.businessName || coach.name

  async function lookup(formData: FormData) {
    "use server"

    const value = String(formData.get("dni") ?? "").trim()
    const dniParsed = dniSchema.safeParse(value)

    if (dniParsed.success) {
      const student = await studentService.getByDni(dniParsed.data, coachId)
      if (student) {
        const access = evaluateStudentAccess(student)
        if (!access.allowed) {
          if (access.reason === "expired") {
            redirect(`/${coachSlug}?error=expired`)
          }
          if (access.reason === "manual_blocked") {
            redirect(`/${coachSlug}?error=blocked`)
          }
          redirect(`/${coachSlug}?error=not-found`)
        }
        redirect(`/${coachSlug}/rutina/${dniParsed.data}`)
      }
    } else {
      const matchedProfile = await genericProfileService.verifyPassword(value, coachId)
      if (matchedProfile) {
        redirect(`/${coachSlug}/rutina/generico/${matchedProfile.id}`)
      }
    }

    redirect(`/${coachSlug}?error=not-found`)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center">
        <Image
          src={logoSrc}
          alt={`${brandName} Logo`}
          width={480}
          height={210}
          className="w-3xl h-auto object-cover"
          priority
          unoptimized={logoSrc.startsWith("http")}
        />
        <div className="w-full">
          <p className="mb-2 text-center text-xl font-bold tracking-tight">
            {headline}
          </p>
          <p className="mb-8 text-center text-muted-foreground text-md">
            {tagline}
          </p>

          <form action={lookup} className="w-full flex flex-col gap-3">
            <Input
              name="dni"
              type="text"
              autoComplete="on"
              aria-label="DNI o clave"
              aria-invalid={!!error}
              required
              className="h-10 rounded-xl px-5 text-center text-md font-semibold tracking-widest"
            />

            {error && (
              <p role="alert" className="text-center text-sm text-destructive">
                {ERROR_MESSAGES[error] ?? ERROR_MESSAGES["not-found"]}
              </p>
            )}

            <Button type="submit" className="w-full rounded-xl">
              Ver mi rutina
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
