'use client';

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNavMenu } from "@/components/layout/user-nav-menu";
import { GlobalSearch } from "@/components/layout/global-search";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

function SearchFallback() {
  return <div className="flex-1 max-w-md h-9 bg-muted/50 rounded-md animate-pulse" />;
}

export function DashboardHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center border-b bg-background px-4">
      {/* Left - Sidebar */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
      </div>

      {/* Center - Global Search */}
      <div className="flex-1 flex justify-center px-4">
        <Suspense fallback={<SearchFallback />}>
          <GlobalSearch />
        </Suspense>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/sources/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Kaynak Ekle</span>
          </Link>
        </Button>

        <ThemeToggle />

        <UserNavMenu />
      </div>
    </header>
  );
}
