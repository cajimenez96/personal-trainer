import Link from "next/link"
import { signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/alumnos", label: "Alumnos" },
  { href: "/ejercicios", label: "Ejercicios" },
  { href: "/plantillas", label: "Plantillas" },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between bg-[#0d0d0d] px-6 py-4 text-white">
        <div className="flex items-center gap-6">
          <span className="font-heading text-sm font-semibold tracking-wide uppercase">
            Santiago Ramón — Panel
          </span>
          <nav className="flex items-center gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-heading text-sm text-white/70 transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}
        >
          <Button type="submit" variant="secondary">
            Cerrar sesión
          </Button>
        </form>
      </header>
      <main className="flex-1 p-6">{children}</main>
      <Toaster />
    </div>
  )
}
