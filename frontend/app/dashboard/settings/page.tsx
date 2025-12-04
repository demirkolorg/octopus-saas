'use client';

import { useState } from 'react';
import { useSettings, useUpdateSettings, useResetSettings } from '@/hooks/use-settings';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/use-tags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  Bell,
  Mail,
  Clock,
  Tag,
  Trash2,
  Plus,
  Loader2,
  Save,
  RotateCcw,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

const TIMEZONE_OPTIONS = [
  { value: 'Europe/Istanbul', label: 'Türkiye (GMT+3)' },
  { value: 'Europe/London', label: 'Londra (GMT+0/+1)' },
  { value: 'Europe/Berlin', label: 'Berlin (GMT+1/+2)' },
  { value: 'America/New_York', label: 'New York (GMT-5/-4)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8/-7)' },
];

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '18:00', '19:00', '20:00', '21:00', '22:00',
];

const TAG_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#6b7280',
];

export default function SettingsPage() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const resetSettings = useResetSettings();

  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [editingTagColor, setEditingTagColor] = useState('');

  const handleSettingChange = async (key: string, value: boolean | string) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
      toast.success('Ayar güncellendi');
    } catch (error) {
      toast.error('Ayar güncellenemedi');
    }
  };

  const handleResetSettings = async () => {
    try {
      await resetSettings.mutateAsync();
      toast.success('Ayarlar varsayılana sıfırlandı');
    } catch (error) {
      toast.error('Ayarlar sıfırlanamadı');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      await createTag.mutateAsync({ name: newTagName.trim(), color: newTagColor });
      setNewTagName('');
      setNewTagColor(TAG_COLORS[0]);
      toast.success('Etiket oluşturuldu');
    } catch (error) {
      toast.error('Etiket oluşturulamadı');
    }
  };

  const handleUpdateTag = async (id: string) => {
    if (!editingTagName.trim()) return;
    try {
      await updateTag.mutateAsync({
        id,
        data: { name: editingTagName.trim(), color: editingTagColor },
      });
      setEditingTagId(null);
      toast.success('Etiket güncellendi');
    } catch (error) {
      toast.error('Etiket güncellenemedi');
    }
  };

  const handleDeleteTag = async (id: string) => {
    try {
      await deleteTag.mutateAsync(id);
      toast.success('Etiket silindi');
    } catch (error) {
      toast.error('Etiket silinemedi');
    }
  };

  const startEditingTag = (tag: { id: string; name: string; color: string }) => {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
    setEditingTagColor(tag.color);
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Ayarlar
          </h1>
          <p className="text-muted-foreground mt-1">
            Bildirim ve uygulama tercihlerinizi yönetin
          </p>
        </div>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-posta Bildirimleri
          </CardTitle>
          <CardDescription>
            Günlük haber özetleri ve bildirimler için e-posta ayarları
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Daily Digest Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="digest">Günlük Özet E-postası</Label>
              <p className="text-sm text-muted-foreground">
                Her gün belirlediğiniz saatte haber özeti alın
              </p>
            </div>
            <Switch
              id="digest"
              checked={settings?.emailDigestEnabled ?? true}
              onCheckedChange={(checked) => handleSettingChange('emailDigestEnabled', checked)}
              disabled={updateSettings.isPending}
            />
          </div>

          <Separator />

          {/* Digest Time */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Özet Gönderim Saati
              </Label>
              <p className="text-sm text-muted-foreground">
                Günlük özetin gönderileceği saat
              </p>
            </div>
            <select
              className="h-9 px-3 rounded-md border bg-background text-sm"
              value={settings?.emailDigestTime ?? '08:00'}
              onChange={(e) => handleSettingChange('emailDigestTime', e.target.value)}
              disabled={!settings?.emailDigestEnabled || updateSettings.isPending}
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Saat Dilimi</Label>
              <p className="text-sm text-muted-foreground">
                E-posta gönderim saati için saat dilimi
              </p>
            </div>
            <select
              className="h-9 px-3 rounded-md border bg-background text-sm"
              value={settings?.emailDigestTimezone ?? 'Europe/Istanbul'}
              onChange={(e) => handleSettingChange('emailDigestTimezone', e.target.value)}
              disabled={!settings?.emailDigestEnabled || updateSettings.isPending}
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <Separator />

          {/* Error Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="errors" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Hata Bildirimleri
              </Label>
              <p className="text-sm text-muted-foreground">
                Kaynak tarama hataları için e-posta bildirimi alın
              </p>
            </div>
            <Switch
              id="errors"
              checked={settings?.notifyOnErrors ?? true}
              onCheckedChange={(checked) => handleSettingChange('notifyOnErrors', checked)}
              disabled={updateSettings.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tags Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Etiketler
          </CardTitle>
          <CardDescription>
            Makaleleri organize etmek için etiketlerinizi yönetin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create new tag */}
          <div className="flex gap-2">
            <div className="flex gap-2 flex-1">
              <Input
                placeholder="Yeni etiket adı..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                className="flex-1"
              />
              <div className="flex gap-1">
                {TAG_COLORS.slice(0, 5).map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={`w-7 h-7 rounded-full transition-all ${
                      newTagColor === color ? 'ring-2 ring-offset-2 ring-primary' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleCreateTag} disabled={!newTagName.trim() || createTag.isPending}>
              {createTag.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Separator />

          {/* Tags list */}
          <div className="space-y-2">
            {tagsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tags.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Henüz etiket oluşturmadınız
              </p>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  {editingTagId === tag.id ? (
                    <>
                      <Input
                        value={editingTagName}
                        onChange={(e) => setEditingTagName(e.target.value)}
                        className="flex-1 h-8"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setEditingTagColor(color)}
                            className={`w-5 h-5 rounded-full transition-all ${
                              editingTagColor === color
                                ? 'ring-2 ring-offset-1 ring-primary'
                                : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleUpdateTag(tag.id)}
                        disabled={updateTag.isPending}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingTagId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 font-medium">{tag.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => startEditingTag(tag)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Etiketi Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{tag.name}" etiketini silmek istediğinize emin misiniz?
                              Bu işlem geri alınamaz ve tüm makalelerden bu etiket kaldırılır.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTag(tag.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reset Settings */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Ayarları Sıfırla
          </CardTitle>
          <CardDescription>
            Tüm ayarları varsayılan değerlerine döndürür
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <RotateCcw className="h-4 w-4 mr-2" />
                Varsayılana Sıfırla
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ayarları Sıfırla</AlertDialogTitle>
                <AlertDialogDescription>
                  Tüm bildirim ayarlarınız varsayılan değerlerine döndürülecek.
                  Etiketleriniz etkilenmez. Devam etmek istiyor musunuz?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleResetSettings}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sıfırla
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
