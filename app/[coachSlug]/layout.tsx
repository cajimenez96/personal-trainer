import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTrainerBySlug } from "@/lib/tenant"
import { RESERVED_SLUGS } from "@/lib/validators/slug"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ coachSlug: string }>
}): Promise<Metadata> {
  const { coachSlug } = await params
  if (RESERVED_SLUGS.includes(coachSlug as any)) return {}

  const coach = await getTrainerBySlug(coachSlug)
  if (!coach || !coach.isActive) {
    return {
      title: "Entrenador no disponible",
    }
  }

  const title = coach.businessName || coach.name
  const description =
    coach.tagline || coach.headline || `Plataforma de entrenamiento de ${coach.name}`

  return {
    title: `${title} | Rutinas y Entrenamiento`,
    description,
    openGraph: {
      title: `${title} | Rutinas y Entrenamiento`,
      description,
      images: coach.logoUrl ? [coach.logoUrl] : [],
    },
  }
}

import { Toaster } from "@/components/ui/sonner"

export default async function CoachPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ coachSlug: string }>
}) {
  const { coachSlug } = await params
  if (RESERVED_SLUGS.includes(coachSlug as any)) {
    notFound()
  }

  const coach = await getTrainerBySlug(coachSlug)
  if (!coach) {
    notFound()
  }

  if (!coach.isActive) {
    return (
      <div className="dark flex min-h-screen flex-col items-center justify-center bg-[#0d0d0d] px-4 text-center text-white">
        <div className="max-w-md rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-sm">
          <h1 className="text-xl font-bold text-white">Entrenador no disponible</h1>
          <p className="mt-2 text-sm text-white/60">
            El portal de este entrenador se encuentra temporalmente inactivo. Por favor, ponete en contacto directo con tu profesor.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="dark min-h-screen bg-[#0d0d0d] text-foreground">
      {children}
      <Toaster />
    </div>
  )
}
