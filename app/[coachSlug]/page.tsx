import Image from "next/image"
import { notFound, redirect } from "next/navigation"
import { MessageCircle } from "lucide-react"
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
    <div className="dark min-h-screen flex flex-col items-center justify-center bg-[#0d0d0d] text-white selection:bg-primary selection:text-white px-4 py-8 relative overflow-hidden">
      {/* Ambient background brand glow matching preview & portal */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[650px] rounded-full bg-primary/15 blur-[130px]" />

      <div className="relative flex w-full max-w-sm flex-col items-center text-center space-y-6">
        {/* Dynamic Coach Logo */}
        <div className="relative h-16 w-48 flex items-center justify-center">
          <Image
            src={logoSrc}
            alt={`${brandName} Logo`}
            width={480}
            height={210}
            className="max-h-16 w-auto object-contain"
            priority
            unoptimized={logoSrc.startsWith("http")}
          />
        </div>

        {/* Headline and Tagline matching live preview */}
        <div className="space-y-1.5 w-full">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white leading-tight">
            {headline}
          </h1>
          <p className="text-sm text-white/70">
            {tagline}
          </p>
        </div>

        {/* DNI / Clave Box matching live preview */}
        <div className="w-full rounded-2xl bg-white/[0.04] border border-white/10 p-5 sm:p-6 shadow-2xl backdrop-blur-sm space-y-4">
          <form action={lookup} className="w-full flex flex-col gap-4 text-left">
            <div className="space-y-1.5">
              <label htmlFor="dni" className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                Número de DNI o Clave
              </label>
              <Input
                id="dni"
                name="dni"
                type="text"
                autoComplete="on"
                placeholder="12345678"
                aria-label="DNI o clave"
                aria-invalid={!!error}
                required
                className="h-12 rounded-xl bg-white/[0.07] border-white/15 px-4 text-center text-lg sm:text-xl font-mono font-semibold tracking-widest text-white placeholder:text-white/30 focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>

            {error && (
              <p role="alert" className="text-center text-sm font-medium text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl p-3">
                {ERROR_MESSAGES[error] ?? ERROR_MESSAGES["not-found"]}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-heading font-semibold uppercase tracking-wider text-sm shadow-lg shadow-primary/20"
            >
              Ingresar a mi rutina
            </Button>
          </form>
        </div>

        {/* WhatsApp Contact Badge if configured */}
        {coach.whatsappNumber && (
          <div className="inline-flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3.5 py-1.5 rounded-full">
            <MessageCircle className="size-3.5" />
            <span>Contacto WhatsApp: {coach.whatsappNumber}</span>
          </div>
        )}
      </div>
    </div>
  )
}
