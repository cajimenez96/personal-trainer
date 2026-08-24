"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BulkAssignRunner } from "@/components/admin/bulk-assign-runner"

export type SelectableStudent = {
  id: string
  name: string
  dni: string
  paymentExpiresAt: string | null
  paymentExpired: boolean
}

export function StudentSelectionTable({
  templateId,
  templateName,
  students,
}: {
  templateId: string
  templateName: string
  students: SelectableStudent[]
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(students.map((s) => s.id)),
  )

  const allSelected = students.length > 0 && selected.size === students.length

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(students.map((s) => s.id)) : new Set())
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                  disabled={students.length === 0}
                  aria-label="Seleccionar todos"
                />
              </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Cuota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No se encontraron alumnos.
                </TableCell>
              </TableRow>
            )}
            {students.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={(e) => toggleOne(s.id, e.target.checked)}
                    aria-label={`Seleccionar ${s.name}`}
                  />
                </TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.dni}</TableCell>
                <TableCell>
                  {s.paymentExpiresAt ? (
                    <Badge variant={s.paymentExpired ? "destructive" : "success"}>
                      {s.paymentExpiresAt}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BulkAssignRunner
        templateId={templateId}
        templateName={templateName}
        students={students.filter((s) => selected.has(s.id)).map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  )
}
