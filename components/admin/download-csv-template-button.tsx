"use client"

import { Button } from "@/components/ui/button"

export function DownloadCsvTemplateButton({
  filename,
  content,
  label,
}: {
  filename: string
  content: string
  label: string
}) {
  function handleDownload() {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="ghost" onClick={handleDownload}>
      {label}
    </Button>
  )
}
