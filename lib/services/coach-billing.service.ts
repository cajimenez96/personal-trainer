import { db } from "@/lib/db";
import type { SubscriptionStatus } from "@/app/generated/prisma/client";
import { platformPlanRepository } from "@/lib/repositories/platform-plan.repository";
import type {
  AssignCoachPlanInput,
  RecordCoachPaymentInput,
} from "@/lib/validators/coach-billing";

export class CoachNotFoundError extends Error {
  constructor(id: string) {
    super(`No se encontró el entrenador con ID "${id}".`);
    this.name = "CoachNotFoundError";
  }
}

export class CoachBillingService {
  /**
   * Asigna un plan de plataforma al entrenador, creando la suscripción y
   * actualizando sus cupos y fecha de vencimiento en el perfil del tenant.
   */
  async assignPlan(input: AssignCoachPlanInput) {
    const coach = await db.trainer.findUnique({
      where: { id: input.trainerId },
    });
    if (!coach) throw new CoachNotFoundError(input.trainerId);

    const plan = await platformPlanRepository.findById(input.planId);
    if (!plan) throw new Error(`Plan de plataforma "${input.planId}" no encontrado.`);

    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const expiresAt = new Date(startDate);
    expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

    const priceSnapshot =
      input.customPrice !== undefined ? input.customPrice : plan.price;

    return db.$transaction(async (tx) => {
      // 1. Crear registro de suscripción
      const subscription = await tx.trainerSubscription.create({
        data: {
          trainerId: coach.id,
          planId: plan.id,
          priceSnapshot,
          startDate,
          expiresAt,
          status: "ACTIVE",
        },
      });

      // 2. Sincronizar cupos y vencimiento en el Trainer
      const updateData: Record<string, unknown> = {
        platformPlanId: plan.id,
        maxStudents: plan.maxStudents,
        maxPlans: plan.maxPlans,
        maxGenericProfiles: plan.maxGenericProfiles,
      };

      if (input.extendMembership) {
        updateData.membershipExpiresAt = expiresAt;
      }

      await tx.trainer.update({
        where: { id: coach.id },
        data: updateData,
      });

      return subscription;
    });
  }

  /**
   * Asienta un pago manual del entrenador en el libro de pagos (ledger),
   * y opcionalmente extiende la vigencia de su membresía.
   */
  async recordPayment(input: RecordCoachPaymentInput) {
    const coach = await db.trainer.findUnique({
      where: { id: input.trainerId },
      include: {
        trainerSubscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    if (!coach) throw new CoachNotFoundError(input.trainerId);

    const paidAt = new Date(input.paidAt);
    const subscriptionId =
      input.subscriptionId || coach.trainerSubscriptions[0]?.id || null;

    return db.$transaction(async (tx) => {
      // 1. Registrar pago
      const payment = await tx.trainerPayment.create({
        data: {
          trainerId: coach.id,
          subscriptionId,
          amount: input.amount,
          paidAt,
          paymentMethod: input.paymentMethod?.trim() || null,
          notes: input.notes?.trim() || null,
        },
      });

      // 2. Si se solicitó extender vigencia en días
      if (input.extendDays && input.extendDays > 0) {
        const baseDate =
          coach.membershipExpiresAt && coach.membershipExpiresAt > new Date()
            ? new Date(coach.membershipExpiresAt)
            : new Date();
        baseDate.setDate(baseDate.getDate() + input.extendDays);

        await tx.trainer.update({
          where: { id: coach.id },
          data: {
            membershipExpiresAt: baseDate,
            isActive: true, // Si estaba suspendido, el pago reactiva la cuenta
          },
        });

        if (subscriptionId) {
          await tx.trainerSubscription.update({
            where: { id: subscriptionId },
            data: {
              expiresAt: baseDate,
              status: "ACTIVE",
            },
          });
        }
      }

      return payment;
    });
  }

  /**
   * Actualiza el estado de la suscripción (ej: reactivar, suspender o marcar morosa).
   */
  async updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus
  ) {
    return db.trainerSubscription.update({
      where: { id: subscriptionId },
      data: { status },
    });
  }

  /**
   * Obtiene el historial completo de facturación y estado contable del entrenador.
   */
  async getCoachBillingOverview(trainerId: string) {
    const coach = await db.trainer.findUnique({
      where: { id: trainerId },
      include: {
        platformPlan: true,
        trainerSubscriptions: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
        },
        trainerPayments: {
          orderBy: { paidAt: "desc" },
        },
      },
    });
    if (!coach) throw new CoachNotFoundError(trainerId);

    const now = new Date();
    const isExpired = coach.membershipExpiresAt
      ? new Date(coach.membershipExpiresAt) < now
      : false;

    let financialStatus: "AL_DIA" | "POR_VENCER" | "VENCIDO" | "SUSPENDIDO" = "AL_DIA";

    if (!coach.isActive) {
      financialStatus = "SUSPENDED" as any;
    } else if (isExpired) {
      financialStatus = "VENCIDO";
    } else if (coach.membershipExpiresAt) {
      const daysUntilExpiry = Math.ceil(
        (new Date(coach.membershipExpiresAt).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry <= 5) {
        financialStatus = "POR_VENCER";
      }
    }

    const totalPaid = coach.trainerPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    return {
      coach,
      financialStatus,
      totalPaid,
      subscriptions: coach.trainerSubscriptions,
      payments: coach.trainerPayments,
    };
  }
}

export const coachBillingService = new CoachBillingService();
