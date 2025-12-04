'use client';

import { useState, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCreateCategory, useUpdateCategory } from '@/hooks/use-categories';
import { Category } from '@/lib/api/categories';
import {
  Loader2,
  TrendingUp,
  Landmark,
  Trophy,
  Cpu,
  Heart,
  Globe,
  Newspaper,
  Star,
  Palette,
  MapPin,
  Zap,
  DollarSign,
  Users,
  Building2,
  Car,
  Plane,
  Film,
  Music,
  Gamepad2,
  BookOpen,
  GraduationCap,
  Briefcase,
  Scale,
  Shield,
  Leaf,
  Sun,
  Cloud,
  Utensils,
  ShoppingBag,
  Home,
  Microscope,
  Rocket,
  Camera,
  Tv,
  Radio,
  type LucideIcon,
} from 'lucide-react';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  category?: Category | null;
}

// Available icons for selection
const AVAILABLE_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: 'trending-up', icon: TrendingUp },
  { name: 'landmark', icon: Landmark },
  { name: 'trophy', icon: Trophy },
  { name: 'cpu', icon: Cpu },
  { name: 'heart', icon: Heart },
  { name: 'globe', icon: Globe },
  { name: 'newspaper', icon: Newspaper },
  { name: 'star', icon: Star },
  { name: 'palette', icon: Palette },
  { name: 'map-pin', icon: MapPin },
  { name: 'zap', icon: Zap },
  { name: 'dollar-sign', icon: DollarSign },
  { name: 'users', icon: Users },
  { name: 'building-2', icon: Building2 },
  { name: 'car', icon: Car },
  { name: 'plane', icon: Plane },
  { name: 'film', icon: Film },
  { name: 'music', icon: Music },
  { name: 'gamepad-2', icon: Gamepad2 },
  { name: 'book-open', icon: BookOpen },
  { name: 'graduation-cap', icon: GraduationCap },
  { name: 'briefcase', icon: Briefcase },
  { name: 'scale', icon: Scale },
  { name: 'shield', icon: Shield },
  { name: 'leaf', icon: Leaf },
  { name: 'sun', icon: Sun },
  { name: 'cloud', icon: Cloud },
  { name: 'utensils', icon: Utensils },
  { name: 'shopping-bag', icon: ShoppingBag },
  { name: 'home', icon: Home },
  { name: 'microscope', icon: Microscope },
  { name: 'rocket', icon: Rocket },
  { name: 'camera', icon: Camera },
  { name: 'tv', icon: Tv },
  { name: 'radio', icon: Radio },
];

// Predefined category suggestions with colors and icons
const CATEGORY_PRESETS = [
  { name: 'Son Dakika', icon: 'zap', color: '#DC2626' },
  { name: 'Gundem', icon: 'newspaper', color: '#64748B' },
  { name: 'Ekonomi', icon: 'trending-up', color: '#10B981' },
  { name: 'Politika', icon: 'landmark', color: '#6366F1' },
  { name: 'Spor', icon: 'trophy', color: '#F59E0B' },
  { name: 'Teknoloji', icon: 'cpu', color: '#3B82F6' },
  { name: 'Saglik', icon: 'heart', color: '#EF4444' },
  { name: 'Dunya', icon: 'globe', color: '#8B5CF6' },
  { name: 'Magazin', icon: 'star', color: '#EC4899' },
  { name: 'Kultur-Sanat', icon: 'palette', color: '#14B8A6' },
  { name: 'Yerel', icon: 'map-pin', color: '#F97316' },
  { name: 'Egitim', icon: 'graduation-cap', color: '#0EA5E9' },
];

// Helper to get icon component by name
function getIconByName(name: string): LucideIcon | null {
  const found = AVAILABLE_ICONS.find((i) => i.name === name);
  return found ? found.icon : null;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  siteId,
  category,
}: CategoryFormDialogProps) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isEditing = !!category;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#64748B');
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon || '');
      setColor(category.color || '#64748B');
    } else {
      setName('');
      setIcon('');
      setColor('#64748B');
    }
    setShowIconPicker(false);
  }, [category, open]);

  const handlePresetClick = (preset: (typeof CATEGORY_PRESETS)[0]) => {
    setName(preset.name);
    setIcon(preset.icon);
    setColor(preset.color);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: name.trim(),
      icon: icon.trim() || undefined,
      color: color || undefined,
    };

    try {
      if (isEditing && category) {
        await updateCategory.mutateAsync({
          id: category.id,
          data,
        });
      } else {
        await createCategory.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const isPending = createCategory.isPending || updateCategory.isPending;
  const SelectedIcon = icon ? getIconByName(icon) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Kategoriyi Duzenle' : 'Yeni Kategori Ekle'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Kategori bilgilerini guncelleyin'
              : 'Bu site icin yeni bir kategori ekleyin'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preset Suggestions */}
          {!isEditing && (
            <div className="space-y-2">
              <Label>Hazir Kategoriler</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_PRESETS.map((preset) => {
                  const PresetIcon = getIconByName(preset.icon);
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      className="px-3 py-1.5 text-xs rounded-full border hover:bg-muted transition-colors flex items-center gap-1.5"
                      style={{ borderColor: preset.color }}
                    >
                      {PresetIcon && (
                        <PresetIcon
                          className="h-3 w-3"
                          style={{ color: preset.color }}
                        />
                      )}
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Kategori Adi *</Label>
            <Input
              id="name"
              placeholder="Ekonomi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowIconPicker(!showIconPicker)}
              >
                {SelectedIcon ? (
                  <div className="flex items-center gap-2">
                    <SelectedIcon className="h-4 w-4" style={{ color }} />
                    <span className="text-muted-foreground">{icon}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Icon sec...</span>
                )}
              </Button>
              {icon && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIcon('')}
                >
                  Temizle
                </Button>
              )}
            </div>

            {showIconPicker && (
              <ScrollArea className="h-48 border rounded-md p-2">
                <div className="grid grid-cols-7 gap-1">
                  {AVAILABLE_ICONS.map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = icon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => {
                          setIcon(item.name);
                          setShowIconPicker(false);
                        }}
                        className={`p-2 rounded hover:bg-muted transition-colors ${
                          isSelected ? 'bg-primary/10 ring-1 ring-primary' : ''
                        }`}
                        title={item.name}
                      >
                        <IconComponent
                          className="h-5 w-5 mx-auto"
                          style={{ color: isSelected ? color : undefined }}
                        />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Renk</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#64748B"
                className="flex-1"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Onizleme</Label>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              {SelectedIcon && (
                <SelectedIcon className="h-4 w-4" style={{ color }} />
              )}
              {!SelectedIcon && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
              <span className="text-sm font-medium">{name || 'Kategori Adi'}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Iptal
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Guncelle' : 'Olustur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
