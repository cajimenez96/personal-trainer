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

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alumnos", label: "Alumnos", icon: Users },
  { href: "/planes", label: "Planes", icon: CreditCard },
  { href: "/alumnos-genericos", label: "Genéricos", icon: UserCog },
  { href: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { href: "/plantillas", label: "Plantillas", icon: Layers },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function AdminSidebar({
  signOutAction,
}: {
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
    >
      {/* Header with Brand Logo */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden group-data-[collapsible=icon]:justify-center"
        >
          <div className="flex shrink-0 items-center justify-center group-data-[collapsible=icon]:block hidden">
            <Dumbbell className="size-6 text-primary" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <Image
              src={siteConfig.branding.logoNavbar}
              alt={`${siteConfig.name} — Panel`}
              width={190}
              height={70}
              priority
              className="h-8 w-auto object-contain"
            />
          </div>
        </Link>
      </SidebarHeader>

      {/* Main Navigation Links */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 group-data-[collapsible=icon]:hidden">
            Gestión Coach
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/dashboard" &&
                    pathname.startsWith(`${link.href}/`)) ||
                  (link.href === "/dashboard" && pathname === "/dashboard");

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
                        className={`size-4.5 shrink-0 ${isActive ? "text-primary" : ""}`}
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
