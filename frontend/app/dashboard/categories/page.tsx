'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCategories, useDeleteCategory } from '@/hooks/use-categories';
import { Category } from '@/lib/api/categories';
import { CategoryFormDialog } from '@/components/categories/category-form-dialog';
import {
  Tag,
  PlusCircle,
  Pencil,
  Trash2,
  Lock,
  Newspaper,
  TrendingUp,
  Trophy,
  Cpu,
  HeartPulse,
  Palette,
  Globe,
  Landmark,
  GraduationCap,
  FlaskConical,
  Sparkles,
  Car,
} from 'lucide-react';

// Icon mapping for categories
const iconMap: Record<string, React.ReactNode> = {
  'newspaper': <Newspaper className="h-4 w-4" />,
  'trending-up': <TrendingUp className="h-4 w-4" />,
  'trophy': <Trophy className="h-4 w-4" />,
  'cpu': <Cpu className="h-4 w-4" />,
  'heart-pulse': <HeartPulse className="h-4 w-4" />,
  'palette': <Palette className="h-4 w-4" />,
  'globe': <Globe className="h-4 w-4" />,
  'landmark': <Landmark className="h-4 w-4" />,
  'graduation-cap': <GraduationCap className="h-4 w-4" />,
  'flask-conical': <FlaskConical className="h-4 w-4" />,
  'sparkles': <Sparkles className="h-4 w-4" />,
  'car': <Car className="h-4 w-4" />,
};

export default function CategoriesPage() {
  const { data: categories, isLoading, error } = useCategories();
  const deleteCategory = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    deleteCategory.mutate(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  // Sistem ve kullanıcı kategorilerini ayır
  const systemCategories = categories?.filter((c) => c.isSystem) || [];
  const userCategories = categories?.filter((c) => !c.isSystem) || [];

  if (isLoading) {
    return (
      <div className="h-full overflow-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kategoriler</h1>
          <p className="text-muted-foreground">Haberlerinizi organize edin</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kategoriler</h1>
          <p className="text-muted-foreground">Haberlerinizi organize edin</p>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <p>Kategoriler yuklenirken bir hata olustu.</p>
          <p className="text-sm mt-2">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kategoriler</h1>
          <p className="text-muted-foreground">Haberlerinizi organize edin</p>
        </div>
        <Button onClick={handleAddCategory}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Yeni Kategori
        </Button>
      </div>

      {/* Sistem Kategorileri */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          Sistem Kategorileri
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {systemCategories.map((category) => (
            <Card key={category.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: category.color ? `${category.color}20` : '#f1f5f9' }}
                  >
                    <span style={{ color: category.color || '#64748b' }}>
                      {category.icon && iconMap[category.icon] ? iconMap[category.icon] : <Tag className="h-4 w-4" />}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {category._count?.sources || 0} kaynak
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Kullanıcı Kategorileri */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          Kendi Kategorileriniz
        </h2>
        {userCategories.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                Henuz kendi kategorinizi olusturmadiniz
              </p>
              <Button variant="outline" onClick={handleAddCategory}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Kategori Olustur
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {userCategories.map((category) => (
              <Card key={category.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color ? `${category.color}20` : '#f1f5f9' }}
                    >
                      <span style={{ color: category.color || '#64748b' }}>
                        {category.icon && iconMap[category.icon] ? iconMap[category.icon] : <Tag className="h-4 w-4" />}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{category.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {category._count?.sources || 0} kaynak
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm({ id: category.id, name: category.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Category Form Dialog */}
      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editingCategory}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silme Onayı</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteConfirm?.name}&quot; kategorisini silmek istediginize emin misiniz?
              Bu islem geri alinamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Iptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
