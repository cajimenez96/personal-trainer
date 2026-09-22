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
  LogOut,
  ShieldAlert,
  Dumbbell,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { Button } from "@/components/ui/button";

const SUPERADMIN_NAV_LINKS = [
  { href: "/superadmin", label: "Dashboard SaaS", icon: LayoutDashboard },
  { href: "/superadmin/coaches", label: "Profesores / Tenants", icon: Users },
  {
    href: "/superadmin/ejercicios",
    label: "Catálogo Ejercicios",
    icon: Dumbbell,
  },
];

export function SuperAdminNavbar({
  signOutAction,
}: {
  signOutAction: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-[#0d0d0d] px-4 py-3 text-white shadow-md border-b border-primary/30 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand / Logo + SuperAdmin badge */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/superadmin" className="flex items-center">
            <Image
              src={siteConfig.branding.logoNavbar}
              alt={`${siteConfig.name} — SuperAdmin`}
              width={180}
              height={80}
              priority
            />
          </Link>
          {/* <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/20 text-primary border border-primary/40">
            <ShieldAlert className="size-3.5" />
            SUPERADMIN
          </span> */}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {SUPERADMIN_NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/superadmin" && pathname.startsWith(link.href));
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

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="mt-3 border-t border-white/10 pb-4 pt-3 md:hidden">
          <div className="mb-2 px-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/40">
              <ShieldAlert className="size-3.5" />
              SUPERADMIN PANEL
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {SUPERADMIN_NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/superadmin" && pathname.startsWith(link.href));
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
