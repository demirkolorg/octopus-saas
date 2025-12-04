"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag, Loader2, AlertCircle, Lock } from "lucide-react";
import { Category } from "@/lib/api/categories";
import { useCategories } from "@/hooks/use-categories";
import Link from "next/link";

interface CategorySelectorProps {
  value?: string;
  onChange: (categoryId: string, category: Category) => void;
  required?: boolean;
}

export function CategorySelector({
  value,
  onChange,
  required = false,
}: CategorySelectorProps) {
  const { data: categories, isLoading, error } = useCategories();

  const handleSelectChange = (categoryId: string) => {
    const category = categories?.find((c) => c.id === categoryId);
    if (category) {
      onChange(categoryId, category);
    }
  };

  const selectedCategory = categories?.find((c) => c.id === value);

  // Sistem ve kullanıcı kategorilerini ayır
  const systemCategories = categories?.filter((c) => c.isSystem) || [];
  const userCategories = categories?.filter((c) => !c.isSystem) || [];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Kategoriler yukleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        Kategoriler yuklenirken hata olustu
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <Label>
            Kategori {required && <span className="text-destructive">*</span>}
          </Label>
        </div>
        <Link
          href="/dashboard/categories"
          className="text-xs text-muted-foreground hover:text-primary"
        >
          Kategorileri yonet
        </Link>
      </div>

      <Select value={value || ""} onValueChange={handleSelectChange}>
        <SelectTrigger>
          <SelectValue placeholder="Kategori secin (opsiyonel)">
            {selectedCategory ? (
              <div className="flex items-center gap-2">
                {selectedCategory.color && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                )}
                <span>{selectedCategory.name}</span>
                {selectedCategory.isSystem && (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            ) : (
              "Kategori secin (opsiyonel)"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Sistem kategorileri */}
          {systemCategories.length > 0 && (
            <SelectGroup>
              <SelectLabel className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Sistem Kategorileri
              </SelectLabel>
              {systemCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    {category.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          {/* Kullanıcı kategorileri */}
          {userCategories.length > 0 && (
            <SelectGroup>
              <SelectLabel>Kendi Kategorileriniz</SelectLabel>
              {userCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    {category.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>

      {selectedCategory && (
        <p className="text-xs text-muted-foreground">
          Bu kaynak &quot;{selectedCategory.name}&quot; kategorisine eklenecek
        </p>
      )}
    </div>
  );
}
