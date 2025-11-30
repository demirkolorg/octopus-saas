'use client';

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { StatsCards, ArticleList } from "@/components/articles";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Haberler</h1>
          <p className="text-sm text-muted-foreground">
            Kaynaklarınızdan toplanan son haberler
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sources/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Kaynak Ekle
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Article List */}
      <ArticleList />
    </div>
  );
}
