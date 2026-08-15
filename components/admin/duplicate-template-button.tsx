"use client"

import { Button } from "@/components/ui/button"
import { duplicateTemplateAction } from "@/lib/actions/routine-template.actions"

export function DuplicateTemplateButton({ templateId }: { templateId: string }) {
  const action = duplicateTemplateAction.bind(null, templateId)

  return (
    <form action={action}>
      <Button type="submit" variant="outline">
        Duplicar plantilla
      </Button>
    </form>
  )
}
