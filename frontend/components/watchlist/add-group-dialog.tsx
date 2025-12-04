'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { useCreateWatchGroup } from '@/hooks/use-watchlist';
import { Plus, Loader2, FolderPlus, X } from 'lucide-react';

const keywordSchema = z.object({
  keyword: z
    .string()
    .min(2, 'Kelime en az 2 karakter olmalıdır')
    .max(50, 'Kelime en fazla 50 karakter olabilir'),
  description: z.string().max(200, 'Açıklama en fazla 200 karakter olabilir').optional(),
});

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Konu adı en az 1 karakter olmalıdır')
    .max(50, 'Konu adı en fazla 50 karakter olabilir'),
  description: z.string().max(200, 'Açıklama en fazla 200 karakter olabilir').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Geçerli bir renk kodu giriniz').optional(),
  keywords: z.array(keywordSchema).optional(),
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

interface AddGroupDialogProps {
  trigger?: React.ReactNode;
}

export function AddGroupDialog({ trigger }: AddGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const createGroup = useCreateWatchGroup();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      color: colors[0],
      keywords: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'keywords',
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createGroup.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        color: selectedColor,
        keywords: data.keywords?.filter(k => k.keyword.trim()) || undefined,
      });
      setOpen(false);
      reset();
      setSelectedColor(colors[0]);
    } catch {
      // Error handled in hook
    }
  };

  const handleClose = () => {
    setOpen(false);
    reset();
    setSelectedColor(colors[0]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <FolderPlus className="h-4 w-4 mr-2" />
            Konu Oluştur
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Takip Konusu Oluştur</DialogTitle>
            <DialogDescription>
              İlgili kelimeleri bir konu altında organize edin. Örnek: &quot;Van&quot; konusu altında
              ilçe isimleri.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Konu Adı *</Label>
              <Input
                id="name"
                placeholder="Örn: Van, Deprem, Ekonomi"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Konu Açıklaması (AI için genel bağlam)</Label>
              <Textarea
                id="description"
                placeholder="Örn: Van ili ve bağlı ilçelerle ilgili haberler"
                className="resize-none"
                rows={2}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Konu Rengi</Label>
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

            {/* Keywords Section */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Kelimeler (sonra da eklenebilir)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => append({ keyword: '', description: '' })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Kelime Ekle
                </Button>
              </div>

              {fields.length > 0 && (
                <div className="space-y-3 rounded-lg border p-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Kelime"
                          {...register(`keywords.${index}.keyword`)}
                        />
                        <Input
                          placeholder="Açıklama (opsiyonel)"
                          {...register(`keywords.${index}.description`)}
                          className="text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Konuyu oluşturduktan sonra da kelime ekleyebilirsiniz.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              İptal
            </Button>
            <Button type="submit" disabled={createGroup.isPending}>
              {createGroup.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Konu Oluştur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
