import { requireCoachAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { planService } from "@/lib/services/plan.service"
import { PlanManager } from "@/components/admin/plan-manager"

export const dynamic = "force-dynamic"

export default async function PlanesPage() {
  const user = await requireCoachAuth()
  const [plans, trainer] = await Promise.all([
    planService.list(true, user.id),
    db.trainer.findUnique({
      where: { id: user.id },
      select: { maxPlans: true },
    }),
  ])

  return (
    <div className="mx-auto max-w-7xl py-6">
      <PlanManager plans={plans} maxPlans={trainer?.maxPlans ?? 1} />
    </div>
  )
}
