import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Rss, Newspaper, Clock } from "lucide-react";
import Link from "next/link";

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kaynak</CardTitle>
            <Rss className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Aktif haber kaynağı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Okunmamış Haber</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Bekleyen haber
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Son Tarama</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Henüz tarama yapılmadı
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>Henüz kaynak eklemediniz</CardTitle>
          <CardDescription>
            Haber toplamaya başlamak için ilk kaynağınızı ekleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button asChild>
            <Link href="/dashboard/sources/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              İlk Kaynağı Ekle
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
