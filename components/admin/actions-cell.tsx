"use client"

import type { ReactNode } from "react"
import { TableCell } from "@/components/ui/table"

// Stops the click from bubbling up to a ClickableTableRow's navigation —
// for any cell that has its own interactive content (row actions menu,
// video preview, etc).
export function ActionsCell({ children }: { children: ReactNode }) {
  return <TableCell onClick={(e) => e.stopPropagation()}>{children}</TableCell>
}
