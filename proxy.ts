import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// (admin) and (portal) are route groups — they don't add a URL prefix, so we
// can't match on "/admin". Instead: allow the known public (portal) paths and
// treat everything else as an admin route that requires a session.
const PUBLIC_PATHS = ["/", "/login"]

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/rutina") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth")
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const session = await auth()

  if (!session) {
    const loginUrl = new URL("/login", request.url)
    const validCallback =
      pathname && !pathname.startsWith("/_next") ? pathname : "/dashboard"
    loginUrl.searchParams.set("callbackUrl", validCallback)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api/auth|_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
