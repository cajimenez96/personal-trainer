import { planService } from "@/lib/services/plan.service"
import { PlanManager } from "@/components/admin/plan-manager"

export const dynamic = "force-dynamic"

export default async function PlanesPage() {
  const plans = await planService.list(true) // include inactive

  return (
    <div className="mx-auto max-w-7xl py-6">
      <PlanManager plans={plans} />
    </div>
  )
}
