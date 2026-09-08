import type { ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { groupConsecutiveBlocks } from "@/lib/utils/group-blocks"
import { ExerciseBlockCard } from "@/components/portal/exercise-block-card"
import type { RoutineDetailBlock, RoutineDetailDay } from "@/lib/services/assigned-routine.service"

export function RoutineDayAccordion({
  days,
  renderDayActions,
  renderBlockTrailing,
}: {
  days: RoutineDetailDay[]
  renderDayActions?: (day: RoutineDetailDay) => ReactNode
  renderBlockTrailing?: (block: RoutineDetailBlock) => ReactNode
}) {
  return (
    <>
      {days.map((day) => (
        <details
          key={day.id}
          className="group rounded-2xl border border-border/80 bg-card shadow-sm transition-all open:pb-3"
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 py-3.5 text-base font-bold text-[#d32f2f] hover:opacity-90 dark:text-red-400 [&::-webkit-details-marker]:hidden">
            <span className="font-heading text-lg tracking-tight">{day.label}</span>
            <ChevronDown className="size-5 transition-transform duration-200 group-open:rotate-180" />
          </summary>

          <div className="flex flex-col gap-3 px-4 pt-1">
            {day.blocks.length > 0 && renderDayActions?.(day)}

            {day.blocks.length === 0 && (
              <p className="py-2 text-sm text-muted-foreground">Sin ejercicios.</p>
            )}
            {groupConsecutiveBlocks(day.blocks).map((entry, entryIndex) =>
              entry.kind === "single" ? (
                <ExerciseBlockCard
                  key={entry.block.id}
                  block={entry.block}
                  trailingSlot={renderBlockTrailing?.(entry.block)}
                />
              ) : (
                <div
                  key={`group-${entryIndex}-${entry.label}`}
                  className="rounded-xl border-2 border-primary/40 bg-primary/5 p-3"
                >
                  <p className="mb-2 text-sm font-semibold text-primary">
                    Bloque {entry.label} · superserie
                  </p>
                  <div className="flex flex-col gap-3">
                    {entry.blocks.map((block) => (
                      <ExerciseBlockCard
                        key={block.id}
                        block={block}
                        trailingSlot={renderBlockTrailing?.(block)}
                      />
                    ))}
                  </div>
                  {entry.blocks[entry.blocks.length - 1].groupRestSecs !== null && (
                    <p className="mt-2 text-sm font-medium text-muted-foreground">
                      Descanso post-bloque: {entry.blocks[entry.blocks.length - 1].groupRestSecs}s
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        </details>
      ))}
    </>
  )
}
