"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Layers,
  LogOut,
  UserCog,
  CreditCard,
  Settings,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export type SidebarRole = "COACH" | "SUPERADMIN";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const COACH_NAV_LINKS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alumnos", label: "Alumnos", icon: Users },
  { href: "/planes", label: "Planes", icon: CreditCard },
  { href: "/alumnos-genericos", label: "Genéricos", icon: UserCog },
  { href: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { href: "/plantillas", label: "Plantillas", icon: Layers },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

const SUPERADMIN_NAV_LINKS: NavItem[] = [
  { href: "/superadmin", label: "Dashboard SaaS", icon: LayoutDashboard },
  { href: "/superadmin/coaches", label: "Profesores / Tenants", icon: Users },
  {
    href: "/superadmin/ejercicios",
    label: "Catálogo Ejercicios",
    icon: Dumbbell,
  },
];

interface AppSidebarProps {
  role: SidebarRole;
  signOutAction: () => Promise<void>;
}

export function AppSidebar({ role, signOutAction }: AppSidebarProps) {
  const pathname = usePathname();

  const isSuperAdmin = role === "SUPERADMIN";
  const links = isSuperAdmin ? SUPERADMIN_NAV_LINKS : COACH_NAV_LINKS;
  const homeHref = isSuperAdmin ? "/superadmin" : "/dashboard";
  const groupLabel = isSuperAdmin
    ? "Gestión Plataforma SaaS"
    : "Gestión Coach";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
    >
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link
          href={homeHref}
          className={`flex overflow-hidden group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center ${
            isSuperAdmin ? "flex-col gap-2" : "items-center gap-3"
          }`}
        >
          {/* Collapsed Icon */}
          <div className="flex shrink-0 items-center justify-center group-data-[collapsible=icon]:block hidden">
            {isSuperAdmin ? (
              <ShieldAlert className="size-5 text-primary" />
            ) : (
              <Dumbbell className="size-6 text-primary" />
            )}
          </div>

          {/* Expanded Logo */}
          <div className="group-data-[collapsible=icon]:hidden">
            <Image
              src={siteConfig.branding.logoNavbar}
              alt={`${siteConfig.name} — ${isSuperAdmin ? "SuperAdmin" : "Panel"}`}
              width={isSuperAdmin ? 180 : 190}
              height={70}
              priority
              className="h-8 w-auto object-contain"
            />
          </div>

          {/* Superadmin Badge */}
          {isSuperAdmin && (
            <div className="group-data-[collapsible=icon]:hidden md:mx-auto">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/20 text-primary border border-primary/40">
                <ShieldAlert className="size-3" />
                SUPERADMIN PANEL
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      {/* Main Navigation Links */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 group-data-[collapsible=icon]:hidden">
            {groupLabel}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive =
                  pathname === link.href ||
                  (link.href !== homeHref &&
                    pathname.startsWith(`${link.href}/`)) ||
                  (link.href === homeHref && pathname === homeHref);

                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      render={<Link href={link.href} />}
                      tooltip={link.label}
                      isActive={isActive}
                      className={`transition-colors text-sm font-medium ${
                        isActive
                          ? "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary font-semibold"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      }`}
                    >
                      <Icon
                        className={`size-4.5 shrink-0 ${
                          isActive ? "text-primary" : ""
                        }`}
                      />
                      <span>{link.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Logout */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={signOutAction} className="w-full">
              <SidebarMenuButton
                type="submit"
                tooltip="Cerrar sesión"
                className="w-full text-destructive hover:bg-destructive/15 hover:text-destructive active:bg-destructive/20 transition-colors"
              >
                <LogOut className="size-4.5 shrink-0 text-destructive" />
                <span>Cerrar sesión</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
