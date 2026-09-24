"use server"

import { requireSuperAdminAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import {
  createCoachSchema,
  updateCoachBySuperAdminSchema,
  toggleCoachStatusSchema,
  resetCoachPasswordSchema,
  type CreateCoachInput,
  type UpdateCoachBySuperAdminInput,
  type ToggleCoachStatusInput,
  type ResetCoachPasswordInput,
} from "@/lib/validators/superadmin"

export type ActionState<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function createCoachAction(
  input: CreateCoachInput,
): Promise<ActionState<{ id: string; slug: string }>> {
  try {
    await requireSuperAdminAuth()

    const parsed = createCoachSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const {
      name,
      email,
      password,
      slug,
      businessName,
      whatsappNumber,
      maxPlans,
      maxStudents,
      maxGenericProfiles,
      membershipExpiresAt,
    } = parsed.data

    // Verificar si ya existe email
    const existingEmail = await db.trainer.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
    if (existingEmail) {
      return {
        success: false,
        error: "Ya existe un usuario registrado con este correo electrónico",
        fieldErrors: { email: ["El correo ya está en uso"] },
      }
    }

    // Verificar si ya existe slug
    const existingSlug = await db.trainer.findUnique({
      where: { slug: slug.toLowerCase().trim() },
    })
    if (existingSlug) {
      return {
        success: false,
        error: "El slug ya se encuentra en uso por otro profesor",
        fieldErrors: { slug: ["El slug ya está registrado"] },
      }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const coach = await db.trainer.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        slug: slug.toLowerCase().trim(),
        businessName: businessName?.trim() || null,
        whatsappNumber: whatsappNumber?.trim() || null,
        maxPlans: maxPlans ?? 1,
        maxStudents: maxStudents ?? 10,
        maxGenericProfiles: maxGenericProfiles ?? 3,
        membershipExpiresAt: membershipExpiresAt ? new Date(membershipExpiresAt) : null,
        role: "COACH",
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
      },
    })

    revalidatePath("/superadmin")
    revalidatePath("/superadmin/coaches")

    return {
      success: true,
      data: coach,
    }
  } catch (error) {
    console.error("Error creating coach:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al crear el profesor",
    }
  }
}

export async function updateCoachBySuperAdminAction(
  input: UpdateCoachBySuperAdminInput,
): Promise<ActionState<{ id: string; slug: string }>> {
  try {
    await requireSuperAdminAuth()

    const parsed = updateCoachBySuperAdminSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const {
      trainerId,
      name,
      email,
      slug,
      businessName,
      headline,
      tagline,
      logoUrl,
      heroImageUrl,
      whatsappNumber,
      instagramUrl,
      maxPlans,
      maxStudents,
      maxGenericProfiles,
      membershipExpiresAt,
    } = parsed.data

    // Verificar si ya existe email en otro entrenador
    const existingEmail = await db.trainer.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        id: { not: trainerId },
      },
    })
    if (existingEmail) {
      return {
        success: false,
        error: "Ya existe otro usuario registrado con este correo electrónico",
        fieldErrors: { email: ["El correo ya está en uso"] },
      }
    }

    // Verificar si ya existe slug en otro entrenador
    const existingSlug = await db.trainer.findFirst({
      where: {
        slug: slug.toLowerCase().trim(),
        id: { not: trainerId },
      },
    })
    if (existingSlug) {
      return {
        success: false,
        error: "El slug ya se encuentra en uso por otro profesor",
        fieldErrors: { slug: ["El slug ya está registrado"] },
      }
    }

    const updated = await db.trainer.update({
      where: { id: trainerId },
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        slug: slug.toLowerCase().trim(),
        businessName: businessName?.trim() || null,
        headline: headline?.trim() || null,
        tagline: tagline?.trim() || null,
        logoUrl: logoUrl?.trim() || null,
        heroImageUrl: heroImageUrl?.trim() || null,
        whatsappNumber: whatsappNumber?.trim() || null,
        instagramUrl: instagramUrl?.trim() || null,
        maxPlans: maxPlans ?? 1,
        maxStudents: maxStudents ?? 10,
        maxGenericProfiles: maxGenericProfiles ?? 3,
        membershipExpiresAt: membershipExpiresAt ? new Date(membershipExpiresAt) : null,
      },
      select: {
        id: true,
        slug: true,
      },
    })

    revalidatePath("/superadmin")
    revalidatePath("/superadmin/coaches")
    if (updated.slug) {
      revalidatePath(`/${updated.slug}`)
    }

    return {
      success: true,
      data: updated,
    }
  } catch (error) {
    console.error("Error updating coach by superadmin:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al actualizar la información del profesor",
    }
  }
}

export async function toggleCoachStatusAction(
  input: ToggleCoachStatusInput,
): Promise<ActionState<{ id: string; isActive: boolean }>> {
  try {
    const admin = await requireSuperAdminAuth()

    const parsed = toggleCoachStatusSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos",
      }
    }

    const { trainerId, isActive } = parsed.data

    if (trainerId === admin.id && !isActive) {
      return {
        success: false,
        error: "No podés suspender tu propia cuenta de SuperAdmin",
      }
    }

    const updated = await db.trainer.update({
      where: { id: trainerId },
      data: { isActive },
      select: { id: true, isActive: true, slug: true },
    })

    revalidatePath("/superadmin")
    revalidatePath("/superadmin/coaches")
    if (updated.slug) {
      revalidatePath(`/${updated.slug}`)
    }

    return {
      success: true,
      data: { id: updated.id, isActive: updated.isActive },
    }
  } catch (error) {
    console.error("Error toggling coach status:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al actualizar estado del profesor",
    }
  }
}

export async function resetCoachPasswordAction(
  input: ResetCoachPasswordInput,
): Promise<ActionState<{ id: string }>> {
  try {
    await requireSuperAdminAuth()

    const parsed = resetCoachPasswordSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const { trainerId, newPassword } = parsed.data

    const passwordHash = await bcrypt.hash(newPassword, 10)

    const updated = await db.trainer.update({
      where: { id: trainerId },
      data: { passwordHash },
      select: { id: true },
    })

    revalidatePath("/superadmin/coaches")

    return {
      success: true,
      data: { id: updated.id },
    }
  } catch (error) {
    console.error("Error resetting coach password:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al restablecer la contraseña",
    }
  }
}
