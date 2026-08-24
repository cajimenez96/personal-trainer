import Link from "next/link";
import Image from "next/image";
import logoNavbar from "@/app/assets/navbar.png";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/alumnos", label: "Alumnos" },
  { href: "/ejercicios", label: "Ejercicios" },
  { href: "/plantillas", label: "Plantillas" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between bg-[#0d0d0d] px-6 py-4 text-white">
        <div className="flex w-full items-center justify-between gap-6">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src={logoNavbar}
              alt="Santiago Ramón — Panel"
              className="w-40 object-contain"
              priority
            />
          </Link>
          <nav className="flex items-center gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-heading text-sm text-neutral/70 transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="destructiveOutline">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
      <Toaster />
    </div>
  );
}
