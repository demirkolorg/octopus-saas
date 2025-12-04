"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Rss,
  Newspaper,
  Settings,
  Globe,
  Tag,
  ShieldCheck,
  Star,
  Target,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/providers/auth-provider";

const menuItems = [
  {
    title: "Haberler",
    href: "/dashboard",
    icon: Newspaper,
  },
  {
    title: "Kaynaklar",
    href: "/dashboard/sources",
    icon: Rss,
  },
  {
    title: "Favoriler",
    href: "/dashboard/favorites",
    icon: Star,
  },
  {
    title: "Takip Listesi",
    href: "/dashboard/watchlist",
    icon: Target,
  },
  {
    title: "Günlük Özet",
    href: "/dashboard/summary",
    icon: FileText,
  },
  {
    title: "Siteler",
    href: "/dashboard/sites",
    icon: Globe,
  },
  {
    title: "Kategoriler",
    href: "/dashboard/categories",
    icon: Tag,
  },
];

const settingsItems = [
  {
    title: "Ayarlar",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img
            src="/octopus-deploy-svgrepo-com.svg"
            alt="Ahtapot"
            className="h-10 w-10 invert"
          />
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white">
              Ahtapot
            </span>
            <span className="text-[10px] text-slate-400 -mt-0.5">
              Haber Toplayıcı
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Ana Menü</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistem</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Menu - Only visible to admins */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Yönetim</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname?.startsWith('/dashboard/admin')}
                  >
                    <Link href="/dashboard/admin">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Admin Paneli</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
