import Link from "next/link"
import Image from "next/image"
import { AlertCircle, Lock, CalendarX, ArrowLeft, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/lib/config/site"
import type { StudentAccessReason } from "@/lib/utils/student-access"

interface Props {
  studentName?: string
  reason: StudentAccessReason
  expiresAt?: Date | null
  coachName?: string
  coachBusinessName?: string | null
  logoUrl?: string | null
  whatsappNumber?: string | null
  instagramUrl?: string | null
  backHref?: string
}

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
})

export function StudentAccessBlocked({
  studentName,
  reason,
  expiresAt,
  coachName,
  coachBusinessName,
  logoUrl,
  whatsappNumber,
  instagramUrl,
  backHref = "/",
}: Props) {
  const isExpired = reason === "expired"
  const isManualBlocked = reason === "manual_blocked"
  const displayName = coachBusinessName || coachName || siteConfig.name
  const displayLogo = logoUrl || siteConfig.branding.logoHome

  const cleanPhone = whatsappNumber ? whatsappNumber.replace(/\D/g, "") : null
  const whatsappLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hola ${coachName || ""}, soy ${studentName || "tu alumno"} y quiero regularizar mi acceso a la rutina.`,
      )}`
    : null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <Image
          src={displayLogo}
          alt={`${displayName} Logo`}
          width={280}
          height={180}
          className="w-2xs h-auto object-contain"
          priority
        />

        <div className="flex w-full flex-col items-center rounded-2xl border border-destructive/20 bg-destructive/5 p-6 shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            {isExpired ? (
              <CalendarX className="h-7 w-7" />
            ) : isManualBlocked ? (
              <Lock className="h-7 w-7" />
            ) : (
              <AlertCircle className="h-7 w-7" />
            )}
          </div>

          <h1 className="mb-1 text-xl font-bold tracking-tight text-foreground">
            {isExpired
              ? "Cuota Vencida"
              : isManualBlocked
              ? "Acceso Suspendido"
              : "Acceso No Disponible"}
          </h1>

          {studentName && (
            <p className="mb-3 text-sm font-semibold text-muted-foreground">
              Hola, {studentName}
            </p>
          )}

          <div className="text-sm text-muted-foreground">
            {isExpired ? (
              <p>
                Tu plan de entrenamiento venció el{" "}
                <span className="font-semibold text-destructive">
                  {expiresAt ? dateFormatter.format(expiresAt) : "período anterior"}
                </span>
                . Para renovar tu cuota y continuar entrenando, ponete en contacto con tu entrenador.
              </p>
            ) : isManualBlocked ? (
              <p>
                El acceso a tu rutina fue suspendido temporalmente por el entrenador. Por favor,
                comunicate con él para regularizar tu situación.
              </p>
            ) : (
              <p>
                Tu perfil de alumno no se encuentra activo en el sistema. Consultá con tu
                entrenador para más información.
              </p>
            )}
          </div>
        </div>

        {whatsappLink && (
          <Button
            render={
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            size="lg"
            className="w-full gap-2 rounded-xl bg-[#25D366] text-white hover:bg-[#128C7E]"
          >
            <MessageCircle className="h-5 w-5" />
            Contactar por WhatsApp
          </Button>
        )}

        <Button
          render={<Link href={backHref} />}
          variant="outline"
          size="lg"
          className="w-full gap-2 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a ingresar DNI
        </Button>
      </div>
    </div>
  )
}

