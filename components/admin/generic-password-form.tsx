"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateGenericPasswordAction } from "@/lib/actions/generic-profile.actions"
import type { GenericLevelValue } from "@/lib/validators/generic-profile"

export function GenericPasswordForm({ level }: { level: GenericLevelValue }) {
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit() {
    setPending(true)
    setMessage(null)
    const result = await updateGenericPasswordAction({ level, password })
    setMessage(result.ok ? "Clave actualizada." : (result.error ?? "No se pudo actualizar."))
    if (result.ok) setPassword("")
    setPending(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`password-${level}`} className="text-xs">
        Nueva clave
      </Label>
      <div className="flex gap-2">
        <Input
          id={`password-${level}`}
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="olympia.basico"
          className="h-9"
        />
        <Button type="button" size="sm" onClick={handleSubmit} disabled={pending || password.length < 8}>
          {pending ? "Guardando..." : "Cambiar"}
        </Button>
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  )
}
