import { notFound } from "next/navigation"
import { requireCoachAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { CoachProfileForm } from "@/components/admin/coach-profile-form"

export const dynamic = "force-dynamic"

export default async function ConfiguracionPage() {
  const user = await requireCoachAuth()

  const trainer = await db.trainer.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      slug: true,
      businessName: true,
      headline: true,
      tagline: true,
      logoUrl: true,
      heroImageUrl: true,
      whatsappNumber: true,
      instagramUrl: true,
    },
  })

  if (!trainer) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Configuración y Marca Blanca
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalizá la identidad de tu portal de alumnos, tus canales de
          contacto y tus recursos visuales.
        </p>
      </div>

      <CoachProfileForm initialData={trainer} />
    </div>
  )
}
