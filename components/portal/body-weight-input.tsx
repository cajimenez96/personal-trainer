"use client"

import { useRef, useState } from "react"
import { logBodyWeightAction } from "@/lib/actions/body-weight.actions"

const DEBOUNCE_MS = 600

export function BodyWeightInput({
  dni,
  initialWeightKg,
}: {
  dni: string
  initialWeightKg: number | null
}) {
  const [weight, setWeight] = useState(initialWeightKg !== null ? String(initialWeightKg) : "")
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(value: string) {
    setWeight(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value) return
    debounceRef.current = setTimeout(async () => {
      setSaving(true)
      await logBodyWeightAction({ dni, weightKg: Number(value) })
      setSaving(false)
    }, DEBOUNCE_MS)
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <label htmlFor="body-weight" className="text-sm text-white/60">
        Peso corporal hoy (kg, opcional)
      </label>
      <input
        id="body-weight"
        type="number"
        inputMode="decimal"
        min={0}
        step="0.1"
        value={weight}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="—"
        className="h-9 w-20 rounded-lg border border-white/20 bg-white/10 px-2 text-center text-sm text-white outline-none placeholder:text-white/30 focus-visible:border-white/50"
      />
      {saving && <span className="text-xs text-white/40">Guardando...</span>}
    </div>
  )
}
