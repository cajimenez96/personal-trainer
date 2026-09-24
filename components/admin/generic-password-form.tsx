"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateGenericPasswordAction } from "@/lib/actions/generic-profile.actions"

export function GenericPasswordForm({
  idOrLevel,
  placeholder = "Nueva clave",
}: {
  idOrLevel: string
  placeholder?: string
}) {
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit() {
    setPending(true)
    setMessage(null)
    const result = await updateGenericPasswordAction({ level: idOrLevel, password })
    setMessage(result.ok ? "Clave actualizada." : (result.error ?? "No se pudo actualizar."))
    if (result.ok) setPassword("")
    setPending(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`password-${idOrLevel}`} className="text-xs">
        Cambiar clave de acceso
      </Label>
      <div className="flex gap-2">
        <Input
          id={`password-${idOrLevel}`}
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={placeholder}
          className="h-9"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={pending || password.length < 6}
        >
          {pending ? "Guardando..." : "Cambiar"}
        </Button>
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  )
}
