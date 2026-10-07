"use server";

import { requireSuperAdminAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  assignCoachPlanSchema,
  recordCoachPaymentSchema,
  updateCoachSubscriptionStatusSchema,
  type AssignCoachPlanInput,
  type RecordCoachPaymentInput,
  type UpdateCoachSubscriptionStatusInput,
} from "@/lib/validators/coach-billing";
import { coachBillingService } from "@/lib/services/coach-billing.service";

export type ActionState<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function assignCoachPlanAction(
  input: AssignCoachPlanInput
): Promise<ActionState> {
  try {
    await requireSuperAdminAuth();

    const parsed = assignCoachPlanSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const subscription = await coachBillingService.assignPlan(parsed.data);

    revalidatePath("/superadmin");
    revalidatePath("/superadmin/coaches");

    return { success: true, data: subscription };
  } catch (error) {
    console.error("Error assigning coach plan:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al asignar el plan al entrenador",
    };
  }
}

export async function recordCoachPaymentAction(
  input: RecordCoachPaymentInput
): Promise<ActionState> {
  try {
    await requireSuperAdminAuth();

    const parsed = recordCoachPaymentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const payment = await coachBillingService.recordPayment(parsed.data);

    revalidatePath("/superadmin");
    revalidatePath("/superadmin/coaches");

    return { success: true, data: payment };
  } catch (error) {
    console.error("Error recording coach payment:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al registrar el pago del entrenador",
    };
  }
}

export async function updateCoachSubscriptionStatusAction(
  input: UpdateCoachSubscriptionStatusInput
): Promise<ActionState> {
  try {
    await requireSuperAdminAuth();

    const parsed = updateCoachSubscriptionStatusSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos",
      };
    }

    const updated = await coachBillingService.updateSubscriptionStatus(
      parsed.data.subscriptionId,
      parsed.data.status
    );

    revalidatePath("/superadmin");
    revalidatePath("/superadmin/coaches");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating subscription status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al actualizar el estado de la suscripción",
    };
  }
}
