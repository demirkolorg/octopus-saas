'use client';

import { useAuth } from '@/lib/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Calendar, Rss, Globe, Tag, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Profil bilgileri yüklenemedi.
      </div>
    );
  }

  const initials = user.email
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  const createdDate = new Date(profile.createdAt).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profil</h1>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl">{user.email}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role === 'ADMIN' ? 'Yönetici' : 'Kullanıcı'}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />

          <div className="grid gap-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">E-posta:</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Kayıt Tarihi:</span>
              <span className="font-medium">{createdDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">İstatistikler</CardTitle>
          <CardDescription>Hesabınıza ait özet bilgiler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Rss className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{profile._count.sources}</div>
              <div className="text-xs text-muted-foreground">Kaynak</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Globe className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{profile._count.sites}</div>
              <div className="text-xs text-muted-foreground">Site</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Tag className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{profile._count.categories}</div>
              <div className="text-xs text-muted-foreground">Kategori</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account ID (for support) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hesap Bilgileri</CardTitle>
          <CardDescription>Destek için kullanılabilir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Hesap ID:</span>
            <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
              {user.id}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
