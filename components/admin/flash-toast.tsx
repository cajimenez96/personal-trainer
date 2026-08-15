"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

export function FlashToast({ messages }: { messages: Record<string, string> }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const flashKey = Object.keys(messages).find((key) => searchParams.get(key))

  useEffect(() => {
    if (!flashKey) return
    toast.success(messages[flashKey])

    const params = new URLSearchParams(searchParams)
    params.delete(flashKey)
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashKey])

  return null
}
