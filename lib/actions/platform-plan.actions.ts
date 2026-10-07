"use server";

import { requireSuperAdminAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  createPlatformPlanSchema,
  updatePlatformPlanSchema,
  togglePlatformPlanSchema,
  setGlobalTrialDaysSchema,
  type CreatePlatformPlanInput,
  type UpdatePlatformPlanInput,
  type TogglePlatformPlanInput,
  type SetGlobalTrialDaysInput,
} from "@/lib/validators/platform-plan";
import { platformPlanService } from "@/lib/services/platform-plan.service";

export type ActionState<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createPlatformPlanAction(
  input: CreatePlatformPlanInput
): Promise<ActionState> {
  try {
    await requireSuperAdminAuth();

    const parsed = createPlatformPlanSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const plan = await platformPlanService.create(parsed.data);

    revalidatePath("/superadmin");
    revalidatePath("/superadmin/planes");
    revalidatePath("/superadmin/coaches");

    return { success: true, data: plan };
  } catch (error) {
    console.error("Error creating platform plan:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al crear el plan de plataforma",
    };
  }
}

export async function updatePlatformPlanAction(
  input: UpdatePlatformPlanInput
): Promise<ActionState> {
  try {
    await requireSuperAdminAuth();

    const parsed = updatePlatformPlanSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const plan = await platformPlanService.update(parsed.data);

    revalidatePath("/superadmin");
    revalidatePath("/superadmin/planes");
    revalidatePath("/superadmin/coaches");

    return { success: true, data: plan };
  } catch (error) {
    console.error("Error updating platform plan:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al actualizar el plan de plataforma",
    };
  }
}

export async function togglePlatformPlanStatusAction(
  input: TogglePlatformPlanInput
): Promise<ActionState> {
  try {
    await requireSuperAdminAuth();

    const parsed = togglePlatformPlanSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos",
      };
    }

    const plan = await platformPlanService.toggleActive(
      parsed.data.id,
      parsed.data.isActive
    );

    revalidatePath("/superadmin");
    revalidatePath("/superadmin/planes");
    revalidatePath("/superadmin/coaches");

    return { success: true, data: plan };
  } catch (error) {
    console.error("Error toggling platform plan:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al cambiar el estado del plan",
    };
  }
}

export async function deletePlatformPlanAction(
  id: string
): Promise<ActionState> {
  try {
    await requireSuperAdminAuth();

    if (!id || typeof id !== "string") {
      return { success: false, error: "ID de plan inválido" };
    }

    await platformPlanService.delete(id);

    revalidatePath("/superadmin");
    revalidatePath("/superadmin/planes");
    revalidatePath("/superadmin/coaches");

    return { success: true };
  } catch (error) {
    console.error("Error deleting platform plan:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al eliminar el plan de plataforma",
    };
  }
}

export async function setGlobalTrialDaysAction(
  input: SetGlobalTrialDaysInput
): Promise<ActionState<{ updatedCount: number; trialDays: number }>> {
  try {
    await requireSuperAdminAuth();

    const parsed = setGlobalTrialDaysSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Días de prueba inválidos. Debe ser un número entre 0 y 365.",
      };
    }

    const updatedCount = await platformPlanService.setGlobalTrialDays(
      parsed.data.trialDays
    );

    revalidatePath("/superadmin");
    revalidatePath("/superadmin/planes");
    revalidatePath("/superadmin/coaches");

    return {
      success: true,
      data: { updatedCount, trialDays: parsed.data.trialDays },
    };
  } catch (error) {
    console.error("Error setting global trial days:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al configurar los días de prueba para los planes",
    };
  }
}
