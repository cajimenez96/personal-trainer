"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { assignGenericTemplateAction } from "@/lib/actions/generic-profile.actions"

export function ConfirmGenericAssignment({
  profileId,
  profileName,
  templateId,
  templateName,
}: {
  profileId: string
  profileName: string
  templateId: string
  templateName: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setPending(true)
    setError(null)
    const result = await assignGenericTemplateAction({ profileId, templateId })
    if (!result.ok) {
      setError(result.error ?? "No se pudo asignar la rutina.")
      setPending(false)
      return
    }
    router.push("/alumnos-genericos")
  }

  return (
    <div className="flex flex-col gap-3">
      <p>
        Vas a asignar <strong>{templateName}</strong> a <strong>{profileName}</strong>.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleConfirm} disabled={pending}>
        {pending ? "Asignando..." : "Confirmar asignación"}
      </Button>
    </div>
  )
}
