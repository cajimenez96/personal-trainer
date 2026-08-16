// HU-33: agrupa bloques consecutivos que comparten `groupLabel` (superserie/
// circuito). El agrupamiento es puramente por orden consecutivo + etiqueta —
// no hay un id relacional de grupo, coherente con el resto del schema, que
// tampoco modela calendario ni estructura extra más allá de lo necesario.
export type GroupableBlock = { groupLabel: string | null }

export type DisplayGroup<T> =
  | { kind: "single"; block: T }
  | { kind: "group"; label: string; blocks: T[] }

export function groupConsecutiveBlocks<T extends GroupableBlock>(blocks: T[]): DisplayGroup<T>[] {
  const result: DisplayGroup<T>[] = []

  for (const block of blocks) {
    const label = block.groupLabel?.trim() || null
    const last = result[result.length - 1]

    if (label && last?.kind === "group" && last.label === label) {
      last.blocks.push(block)
    } else if (label) {
      result.push({ kind: "group", label, blocks: [block] })
    } else {
      result.push({ kind: "single", block })
    }
  }

  return result
}
