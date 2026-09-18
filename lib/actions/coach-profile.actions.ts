"use server"

import { requireCoachAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import {
  updateCoachProfileSchema,
  type UpdateCoachProfileInput,
} from "@/lib/validators/coach-profile"

export type ActionState<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function updateCoachProfileAction(
  input: UpdateCoachProfileInput,
): Promise<ActionState<{ id: string; slug: string }>> {
  try {
    const user = await requireCoachAuth()

    const parsed = updateCoachProfileSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos de formulario inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const {
      name,
      businessName,
      headline,
      tagline,
      logoUrl,
      heroImageUrl,
      whatsappNumber,
      instagramUrl,
    } = parsed.data

    const updated = await db.trainer.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        businessName: businessName?.trim() || null,
        headline: headline?.trim() || null,
        tagline: tagline?.trim() || null,
        logoUrl: logoUrl?.trim() || null,
        heroImageUrl: heroImageUrl?.trim() || null,
        whatsappNumber: whatsappNumber?.trim() || null,
        instagramUrl: instagramUrl?.trim() || null,
      },
      select: {
        id: true,
        slug: true,
      },
    })

    revalidatePath("/configuracion")
    revalidatePath("/dashboard")
    if (updated.slug) {
      revalidatePath(`/${updated.slug}`)
    }

    return {
      success: true,
      data: updated,
    }
  } catch (error) {
    console.error("Error updating coach profile:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al actualizar la configuración del perfil",
    }
  }
}
