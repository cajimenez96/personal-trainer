import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_EXACT_PATHS = ["/", "/login"]

function isPublicPath(pathname: string) {
  if (PUBLIC_EXACT_PATHS.includes(pathname)) return true
  if (
    pathname.startsWith("/rutina") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/assets")
  ) {
    return true
  }

  // Rutas administrativas protegidas explícitas
  const protectedAdminPrefixes = [
    "/dashboard",
    "/alumnos",
    "/alumnos-genericos",
    "/planes",
    "/ejercicios",
    "/plantillas",
    "/configuracion",
    "/superadmin",
  ]

  const isProtectedAdmin = protectedAdminPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  // Si no es un prefijo de administración conocido, es una ruta pública de portal (ej: /[coachSlug] o /[coachSlug]/rutina/[dni])
  return !isProtectedAdmin
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const session = await auth()

  if (!session?.user) {
    const loginUrl = new URL("/login", request.url)
    const validCallback =
      pathname && !pathname.startsWith("/_next") ? pathname : "/dashboard"
    loginUrl.searchParams.set("callbackUrl", validCallback)
    return NextResponse.redirect(loginUrl)
  }

  // Si la cuenta fue suspendida/desactivada
  if (session.user.isActive === false) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("error", "InactiveAccount")
    return NextResponse.redirect(loginUrl)
  }

  // Protección de rutas SuperAdmin
  if (pathname.startsWith("/superadmin")) {
    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api/auth|_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

