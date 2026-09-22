import type { ReactNode } from "react"

export function RoutinePortalHeader({
  greetingLabel,
  title,
  subtitle,
  titleActionSlot,
  trailingSlot,
}: {
  greetingLabel: string
  title: string
  subtitle: string
  titleActionSlot?: ReactNode
  trailingSlot?: ReactNode
}) {
  return (
    <header className="bg-[#0d0d0d] px-4 py-5 text-white">
      <p className="text-sm text-white/60">{greetingLabel}</p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-semibold">{title}</h1>
        {titleActionSlot}
      </div>
      <p className="mt-1 text-sm text-white/60">{subtitle}</p>
      {trailingSlot}
    </header>
  )
}
