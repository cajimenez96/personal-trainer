import { requireSuperAdminAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PlatformPlanManager } from "@/components/superadmin/platform-plan-manager";

export const dynamic = "force-dynamic";

export default async function SuperAdminPlanesPage() {
  await requireSuperAdminAuth();

  const plans = await db.platformPlan.findMany({
    orderBy: { price: "asc" },
    include: {
      _count: {
        select: {
          trainers: true,
          subscriptions: true,
        },
      },
    },
  });

  const serializedPlans = plans.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    durationDays: p.durationDays,
    trialDays: p.trialDays,
    maxStudents: p.maxStudents,
    maxPlans: p.maxPlans,
    maxGenericProfiles: p.maxGenericProfiles,
    isActive: p.isActive,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    coachesCount: p._count.trainers,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PlatformPlanManager plans={serializedPlans} />
    </div>
  );
}
