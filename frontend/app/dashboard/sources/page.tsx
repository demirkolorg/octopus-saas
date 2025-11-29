import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function SourcesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kaynaklar</h1>
          <p className="text-sm text-muted-foreground">
            Takip ettiğiniz haber kaynaklarını yönetin
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sources/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Kaynak Ekle
          </Link>
        </Button>
      </div>

      {/* Empty State */}
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>Henüz kaynak yok</CardTitle>
          <CardDescription>
            Haber toplamaya başlamak için bir kaynak ekleyin
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
