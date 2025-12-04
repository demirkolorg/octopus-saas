'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateWatchKeyword } from '@/hooks/use-watchlist';
import { Plus, Loader2 } from 'lucide-react';

const formSchema = z.object({
  keyword: z
    .string()
    .min(2, 'Kelime en az 2 karakter olmalıdır')
    .max(50, 'Kelime en fazla 50 karakter olabilir'),
  description: z.string().max(200, 'Açıklama en fazla 200 karakter olabilir').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Geçerli bir renk kodu giriniz').optional(),
});

type FormValues = z.infer<typeof formSchema>;

const colors = [
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#10b981', // Green
];

interface AddKeywordDialogProps {
  trigger?: React.ReactNode;
}

export function AddKeywordDialog({ trigger }: AddKeywordDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const createKeyword = useCreateWatchKeyword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: '',
      description: '',
      color: colors[0],
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createKeyword.mutateAsync({
        keyword: data.keyword,
        description: data.description || undefined,
        color: selectedColor,
      });
      setOpen(false);
      reset();
      setSelectedColor(colors[0]);
    } catch {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Kelime Ekle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Takip Kelimesi Ekle</DialogTitle>
            <DialogDescription>
              Haberlerde takip etmek istediğiniz kelimeyi ekleyin. AI analizi ile ilgili haberler
              bulunacaktır.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="keyword">Kelime *</Label>
              <Input
                id="keyword"
                placeholder="Örn: Van, Deprem, Dolar"
                {...register('keyword')}
              />
              {errors.keyword && (
                <p className="text-sm text-red-500">{errors.keyword.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Açıklama (AI için ipucu)</Label>
              <Textarea
                id="description"
                placeholder="Örn: Van ili ile ilgili haberler, hayvan veya dava değil"
                className="resize-none"
                rows={2}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Daha iyi eşleşme için açıklama ekleyin
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Renk</Label>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      selectedColor === color
                        ? 'border-foreground scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={createKeyword.isPending}>
              {createKeyword.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ekle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
