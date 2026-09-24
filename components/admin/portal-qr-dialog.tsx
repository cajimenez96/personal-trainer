"use client"

import { useState, useEffect, useRef } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { QrCode, Download, Copy, Check, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface PortalQrDialogProps {
  slug: string
  brandName?: string
  trigger?: React.ReactNode
}

export function PortalQrDialog({
  slug,
  brandName = "Portal del Entrenador",
  trigger,
}: PortalQrDialogProps) {
  const [open, setOpen] = useState(false)
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const fullUrl = origin ? `${origin}/${slug}` : `/${slug}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast.success("Enlace copiado al portapapeles")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar el enlace")
    }
  }

  const handleDownload = () => {
    if (!qrRef.current) return
    const canvas = qrRef.current.querySelector("canvas")
    if (!canvas) return

    // Create a high-res canvas with padding and caption for printing
    const padding = 32
    const captionHeight = 60
    const exportCanvas = document.createElement("canvas")
    const exportCtx = exportCanvas.getContext("2d")
    if (!exportCtx) return

    exportCanvas.width = canvas.width + padding * 2
    exportCanvas.height = canvas.height + padding * 2 + captionHeight

    // Background
    exportCtx.fillStyle = "#ffffff"
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)

    // Draw QR
    exportCtx.drawImage(canvas, padding, padding)

    // Draw Brand Name & URL text
    exportCtx.fillStyle = "#111827"
    exportCtx.font = "bold 18px sans-serif"
    exportCtx.textAlign = "center"
    exportCtx.fillText(
      brandName,
      exportCanvas.width / 2,
      canvas.height + padding + 28,
    )

    exportCtx.fillStyle = "#6b7280"
    exportCtx.font = "13px monospace"
    exportCtx.fillText(
      fullUrl,
      exportCanvas.width / 2,
      canvas.height + padding + 48,
    )

    // Download PNG
    const link = document.createElement("a")
    link.download = `qr-portal-${slug}.png`
    link.href = exportCanvas.toDataURL("image/png")
    link.click()

    toast.success("Código QR descargado con éxito")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5">
              <QrCode className="size-3.5" />
              Código QR
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="size-5 text-primary" />
            Código QR de tu Portal
          </DialogTitle>
          <DialogDescription>
            Tus alumnos pueden escanear este código con la cámara de su celular
            para acceder directamente a su portal y consultar sus rutinas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center gap-4 py-4">
          {/* QR Container */}
          <div
            ref={qrRef}
            className="flex items-center justify-center rounded-2xl bg-white p-5 shadow-sm border border-border"
          >
            <QRCodeCanvas
              value={fullUrl}
              size={240}
              level="H"
              marginSize={1}
            />
          </div>

          {/* URL text */}
          <div className="w-full text-center space-y-1">
            <p className="font-semibold text-sm text-foreground">{brandName}</p>
            <p className="font-mono text-xs text-muted-foreground break-all">
              {fullUrl}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="w-full sm:w-auto gap-1.5"
          >
            {copied ? (
              <>
                <Check className="size-4 text-emerald-500" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copiar Enlace
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={handleDownload}
            className="w-full sm:w-auto gap-1.5"
          >
            <Download className="size-4" />
            Descargar QR (PNG)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
