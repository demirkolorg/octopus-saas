'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateCategory, useUpdateCategory } from '@/hooks/use-categories';
import { Category } from '@/lib/api/categories';
import {
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
  Tag,
  Briefcase,
  ShoppingBag,
  Plane,
  Music,
  Film,
  Utensils,
} from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Kategori adı en az 2 karakter olmalıdır'),
  icon: z.string().optional(),
  color: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

const iconOptions = [
  { value: 'tag', label: 'Etiket', icon: Tag },
  { value: 'newspaper', label: 'Gazete', icon: Newspaper },
  { value: 'trending-up', label: 'Trend', icon: TrendingUp },
  { value: 'trophy', label: 'Kupa', icon: Trophy },
  { value: 'cpu', label: 'Teknoloji', icon: Cpu },
  { value: 'heart-pulse', label: 'Sağlık', icon: HeartPulse },
  { value: 'palette', label: 'Sanat', icon: Palette },
  { value: 'globe', label: 'Dünya', icon: Globe },
  { value: 'landmark', label: 'Siyaset', icon: Landmark },
  { value: 'graduation-cap', label: 'Eğitim', icon: GraduationCap },
  { value: 'flask-conical', label: 'Bilim', icon: FlaskConical },
  { value: 'sparkles', label: 'Magazin', icon: Sparkles },
  { value: 'car', label: 'Otomobil', icon: Car },
  { value: 'briefcase', label: 'İş', icon: Briefcase },
  { value: 'shopping-bag', label: 'Alışveriş', icon: ShoppingBag },
  { value: 'plane', label: 'Seyahat', icon: Plane },
  { value: 'music', label: 'Müzik', icon: Music },
  { value: 'film', label: 'Sinema', icon: Film },
  { value: 'utensils', label: 'Yemek', icon: Utensils },
];

const colorOptions = [
  { value: '#3b82f6', label: 'Mavi' },
  { value: '#22c55e', label: 'Yeşil' },
  { value: '#f59e0b', label: 'Turuncu' },
  { value: '#ef4444', label: 'Kırmızı' },
  { value: '#8b5cf6', label: 'Mor' },
  { value: '#ec4899', label: 'Pembe' },
  { value: '#06b6d4', label: 'Camgöbeği' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#64748b', label: 'Gri' },
  { value: '#f97316', label: 'Koyu Turuncu' },
  { value: '#d946ef', label: 'Fuşya' },
  { value: '#71717a', label: 'Koyu Gri' },
];

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: CategoryFormDialogProps) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isEditing = !!category;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      icon: 'tag',
      color: '#3b82f6',
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        icon: category.icon || 'tag',
        color: category.color || '#3b82f6',
      });
    } else {
      form.reset({
        name: '',
        icon: 'tag',
        color: '#3b82f6',
      });
    }
  }, [category, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && category) {
        await updateCategory.mutateAsync({
          id: category.id,
          data: values,
        });
      } else {
        await createCategory.mutateAsync(values);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Kategori Düzenle' : 'Yeni Kategori'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Kategori bilgilerini güncelleyin'
              : 'Haberlerinizi organize etmek için yeni bir kategori oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori Adı</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: Finans, Yerel Haberler" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İkon</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="İkon seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {iconOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Renk</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Renk seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: option.value }}
                            />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
