"use client"

import type { ReactNode } from "react"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog"

function toEmbedUrl(videoUrl: string): string | null {
  let url: URL
  try {
    url = new URL(videoUrl)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\.|^m\./, "")

  if (host === "youtube.com") {
    const id =
      url.searchParams.get("v") ??
      ["shorts", "embed", "live"]
        .map((prefix) => (url.pathname.startsWith(`/${prefix}/`) ? url.pathname.split("/")[2] : null))
        .find(Boolean)
    return id ? `https://www.youtube.com/embed/${id}` : null
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1)
    return id ? `https://www.youtube.com/embed/${id}` : null
  }
  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0]
    return id ? `https://player.vimeo.com/video/${id}` : null
  }

  return null
}

// Shows YouTube/Vimeo videos inline in a modal instead of navigating away.
// Falls back to a plain external link for any host we don't know how to embed.
export function VideoDialog({
  videoUrl,
  className,
  children,
}: {
  videoUrl: string
  className?: string
  children: ReactNode
}) {
  const embedUrl = toEmbedUrl(videoUrl)

  if (!embedUrl) {
    return (
      <a href={videoUrl} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  }

  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger render={<button type="button" className={className} />}>
        {children}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="sm:max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Video demostrativo</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
          <iframe
            src={embedUrl}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
