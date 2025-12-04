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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAddKeywordToGroup, useAddBulkKeywordsToGroup } from '@/hooks/use-watchlist';
import { Plus, Loader2, FileText, Type } from 'lucide-react';

// Tekli kelime ekleme formu
const singleFormSchema = z.object({
  keyword: z
    .string()
    .min(2, 'Kelime en az 2 karakter olmalıdır')
    .max(50, 'Kelime en fazla 50 karakter olabilir'),
  description: z.string().max(200, 'Açıklama en fazla 200 karakter olabilir').optional(),
});

type SingleFormValues = z.infer<typeof singleFormSchema>;

// Toplu kelime ekleme formu
const bulkFormSchema = z.object({
  csvContent: z
    .string()
    .min(1, 'En az bir kelime girmelisiniz'),
});

type BulkFormValues = z.infer<typeof bulkFormSchema>;

interface AddGroupKeywordDialogProps {
  groupId: string;
  trigger?: React.ReactNode;
}

// CSV satırını parse et
function parseCSVLine(line: string): { keyword: string; description?: string } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  // Virgül ile ayrılmış ise
  if (trimmed.includes(',')) {
    const firstCommaIndex = trimmed.indexOf(',');
    const keyword = trimmed.slice(0, firstCommaIndex).trim().replace(/^["']|["']$/g, '');
    const description = trimmed.slice(firstCommaIndex + 1).trim().replace(/^["']|["']$/g, '');

    if (keyword.length >= 2) {
      return { keyword, description: description || undefined };
    }
  } else {
    // Sadece kelime var
    const keyword = trimmed.replace(/^["']|["']$/g, '');
    if (keyword.length >= 2) {
      return { keyword };
    }
  }

  return null;
}

export function AddGroupKeywordDialog({ groupId, trigger }: AddGroupKeywordDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('single');
  const addKeyword = useAddKeywordToGroup();
  const addBulkKeywords = useAddBulkKeywordsToGroup();

  const singleForm = useForm<SingleFormValues>({
    resolver: zodResolver(singleFormSchema),
    defaultValues: {
      keyword: '',
      description: '',
    },
  });

  const bulkForm = useForm<BulkFormValues>({
    resolver: zodResolver(bulkFormSchema),
    defaultValues: {
      csvContent: '',
    },
  });

  const onSingleSubmit = async (data: SingleFormValues) => {
    try {
      await addKeyword.mutateAsync({
        groupId,
        data: {
          keyword: data.keyword,
          description: data.description || undefined,
        },
      });
      setOpen(false);
      singleForm.reset();
    } catch {
      // Error handled in hook
    }
  };

  const onBulkSubmit = async (data: BulkFormValues) => {
    const lines = data.csvContent.split('\n');
    const keywords: { keyword: string; description?: string }[] = [];

    for (const line of lines) {
      const parsed = parseCSVLine(line);
      if (parsed) {
        keywords.push(parsed);
      }
    }

    if (keywords.length === 0) {
      bulkForm.setError('csvContent', { message: 'Geçerli kelime bulunamadı' });
      return;
    }

    if (keywords.length > 50) {
      bulkForm.setError('csvContent', { message: 'Tek seferde en fazla 50 kelime ekleyebilirsiniz' });
      return;
    }

    try {
      await addBulkKeywords.mutateAsync({
        groupId,
        data: { keywords },
      });
      setOpen(false);
      bulkForm.reset();
    } catch {
      // Error handled in hook
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      singleForm.reset();
      bulkForm.reset();
      setActiveTab('single');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Kelime Ekle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[70vw] h-[50vh] max-w-none sm:max-w-none flex flex-col">
        <DialogHeader>
          <DialogTitle>Konuya Kelime Ekle</DialogTitle>
          <DialogDescription>
            Tekli veya toplu kelime ekleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Tekli
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Toplu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-4 flex-1 flex flex-col overflow-hidden">
            <form onSubmit={singleForm.handleSubmit(onSingleSubmit)} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                <div className="grid gap-2 flex-shrink-0">
                  <Label htmlFor="keyword">Kelime *</Label>
                  <Input
                    id="keyword"
                    placeholder="Örn: Çaldıran, Özalp, Erciş"
                    {...singleForm.register('keyword')}
                  />
                  {singleForm.formState.errors.keyword && (
                    <p className="text-sm text-red-500">{singleForm.formState.errors.keyword.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                  <Label htmlFor="description">Açıklama (AI için ipucu)</Label>
                  <Textarea
                    id="description"
                    placeholder="Örn: Van iline bağlı ilçe, kişi adı değil"
                    className="flex-1 min-h-[80px] resize-none"
                    {...singleForm.register('description')}
                  />
                  {singleForm.formState.errors.description && (
                    <p className="text-sm text-red-500 flex-shrink-0">{singleForm.formState.errors.description.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    Daha iyi eşleşme için kelimeye özel açıklama ekleyin
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-4 flex-shrink-0">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={addKeyword.isPending}>
                  {addKeyword.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Ekle
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="bulk" className="mt-4 flex-1 flex flex-col overflow-hidden">
            <form onSubmit={bulkForm.handleSubmit(onBulkSubmit)} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                  <Label htmlFor="csvContent">Kelimeler (CSV formatı)</Label>
                  <Textarea
                    id="csvContent"
                    placeholder={`Kelime,Açıklama (AI için İpucu)
İpekyolu,"Van merkez ilçesi, ticaret ve yerleşim yeri"
Edremit,Van'a bağlı ilçe
Erciş
Özalp,"Van ilçesi, sınır bölgesi"`}
                    className="flex-1 min-h-[200px] font-mono text-sm resize-none"
                    {...bulkForm.register('csvContent')}
                  />
                  {bulkForm.formState.errors.csvContent && (
                    <p className="text-sm text-red-500">{bulkForm.formState.errors.csvContent.message}</p>
                  )}
                </div>

                <div className="rounded-lg bg-muted p-3 text-sm flex-shrink-0">
                  <p className="font-medium mb-2">Format:</p>
                  <code className="block text-xs bg-background rounded p-2 mb-2">
                    Kelime,Açıklama (AI için İpucu)
                  </code>
                  <p className="text-muted-foreground text-xs">
                    Her satıra bir kelime yazın. Açıklama opsiyoneldir.<br />
                    Virgül içeren açıklamalar için tırnak kullanın.<br />
                    Tek seferde en fazla 50 kelime eklenebilir.
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-4 flex-shrink-0">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={addBulkKeywords.isPending}>
                  {addBulkKeywords.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Toplu Ekle
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
