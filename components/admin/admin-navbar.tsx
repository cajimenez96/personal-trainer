"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Dumbbell,
  Layers,
  LogOut,
  UserCog,
  CreditCard,
  Settings,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alumnos", label: "Alumnos", icon: Users },
  { href: "/planes", label: "Planes", icon: CreditCard },
  { href: "/alumnos-genericos", label: "Genéricos", icon: UserCog },
  { href: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { href: "/plantillas", label: "Plantillas", icon: Layers },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function AdminNavbar({
  signOutAction,
}: {
  signOutAction: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-[#0d0d0d] px-4 py-3 text-white shadow-md sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/dashboard" className="flex items-center">
          <Image
            src={siteConfig.branding.logoNavbar}
            alt={`${siteConfig.name} — Panel`}
            width={220}
            height={100}
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-heading text-sm uppercase tracking-wider transition-colors ${
                  isActive
                    ? "font-semibold text-primary"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Logout Button */}
        <div className="hidden md:block">
          <form action={signOutAction}>
            <Button type="submit" variant="destructiveOutline" size="sm">
              Cerrar sesión
            </Button>
          </form>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white hover:bg-white/10 active:scale-95 md:hidden"
        >
          {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {isOpen && (
        <div className="mt-3 border-t border-white/10 pb-4 pt-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base transition-colors ${
                    isActive
                      ? "bg-primary/15 font-semibold text-primary"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="size-5 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-white/10 pt-3">
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="destructiveOutline"
                className="w-full justify-center gap-2"
              >
                <LogOut className="size-4" />
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
