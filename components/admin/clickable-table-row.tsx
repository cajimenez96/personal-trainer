"use client"

import { useRouter } from "next/navigation"
import { TableRow } from "@/components/ui/table"

// Navigates on click anywhere in the row. The actions cell stops propagation
// so opening its menu doesn't also trigger navigation.
export function ClickableTableRow({
  href,
  className,
  ...props
}: { href: string } & React.ComponentProps<typeof TableRow>) {
  const router = useRouter()

  return (
    <TableRow
      onClick={() => router.push(href)}
      className={`cursor-pointer ${className ?? ""}`}
      {...props}
    />
  )
}
