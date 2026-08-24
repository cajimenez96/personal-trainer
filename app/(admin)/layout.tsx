import { signOut } from "@/lib/auth";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { Toaster } from "@/components/ui/sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminNavbar signOutAction={handleSignOut} />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
      <Toaster />
    </div>
  );
}
