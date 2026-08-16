"use client"

import { useEffect, useRef, useState } from "react"
import { Pause, Play, Plus, X } from "lucide-react"

const ADD_SECONDS = 15

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function notifyDone() {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch {
    // Web Audio no disponible en este navegador — la vibración (si existe) es el único aviso.
  }
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([200, 100, 200])
}

// Arranca solo al montarse (el padre lo monta cuando el alumno completa un
// ejercicio) y no bloquea el resto de la pantalla — el alumno sigue viendo
// la rutina mientras corre.
export function RestTimer({ seconds, onDismiss }: { seconds: number; onDismiss: () => void }) {
  const [remaining, setRemaining] = useState(seconds)
  const [running, setRunning] = useState(true)
  const firedRef = useRef(false)

  useEffect(() => {
    if (!running || remaining > 0) return
    if (!firedRef.current) {
      firedRef.current = true
      notifyDone()
    }
  }, [running, remaining])

  useEffect(() => {
    if (!running || remaining <= 0) return
    const id = setInterval(() => setRemaining((r) => r - 1), 1000)
    return () => clearInterval(id)
  }, [running, remaining])

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
      <span className="font-heading text-2xl font-semibold tabular-nums text-primary">
        {formatTime(Math.max(remaining, 0))}
      </span>
      <span className="text-sm text-muted-foreground">Descanso</span>
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          aria-label={running ? "Pausar descanso" : "Reanudar descanso"}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button
          type="button"
          onClick={() => setRemaining((r) => r + ADD_SECONDS)}
          aria-label="Agregar 15 segundos"
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Finalizar descanso"
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
