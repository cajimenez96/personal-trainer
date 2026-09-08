import type { ReactNode } from "react"

export function RoutinePortalHeader({
  greetingLabel,
  title,
  subtitle,
  trailingSlot,
}: {
  greetingLabel: string
  title: string
  subtitle: string
  trailingSlot?: ReactNode
}) {
  return (
    <header className="bg-[#0d0d0d] px-4 py-5 text-white">
      <p className="text-sm text-white/60">{greetingLabel}</p>
      <h1 className="font-heading text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-white/60">{subtitle}</p>
      {trailingSlot}
    </header>
  )
}
