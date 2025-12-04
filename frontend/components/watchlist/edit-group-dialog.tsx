'use client';

import { useEffect, useState } from 'react';
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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateWatchGroup } from '@/hooks/use-watchlist';
import { WatchGroup } from '@/lib/api/watchlist';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Konu adı en az 1 karakter olmalıdır')
    .max(50, 'Konu adı en fazla 50 karakter olabilir'),
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

interface EditGroupDialogProps {
  group: WatchGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditGroupDialog({ group, open, onOpenChange }: EditGroupDialogProps) {
  const [selectedColor, setSelectedColor] = useState(group.color);
  const updateGroup = useUpdateWatchGroup();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: group.name,
      description: group.description || '',
      color: group.color,
    },
  });

  // Reset form when group changes or dialog opens
  useEffect(() => {
    if (open) {
      reset({
        name: group.name,
        description: group.description || '',
        color: group.color,
      });
      setSelectedColor(group.color);
    }
  }, [open, group, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      await updateGroup.mutateAsync({
        id: group.id,
        data: {
          name: data.name,
          description: data.description || undefined,
          color: selectedColor,
        },
      });
      onOpenChange(false);
    } catch {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Konuyu Düzenle</DialogTitle>
            <DialogDescription>
              Konu bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Konu Adı *</Label>
              <Input
                id="name"
                placeholder="Örn: Van, Deprem"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                placeholder="Örn: Van ili ve ilçeleriyle ilgili haberler"
                className="resize-none"
                rows={2}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={updateGroup.isPending}>
              {updateGroup.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
