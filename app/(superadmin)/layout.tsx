import { signOut, requireSuperAdminAuth } from "@/lib/auth"
import { SuperAdminNavbar } from "@/components/superadmin/superadmin-navbar"
import { Toaster } from "@/components/ui/sonner"

export const dynamic = "force-dynamic"

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSuperAdminAuth()

  async function handleSignOut() {
    "use server"
    await signOut({ redirectTo: "/login" })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SuperAdminNavbar signOutAction={handleSignOut} />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
      <Toaster />
    </div>
  )
}
