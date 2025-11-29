
  ---
  Octopus Projesi - Kapsamlı Özet

  Proje Nedir?

  Octopus, bireysel kullanıcıların kendi belirledikleri haber kaynaklarından
  otomatik olarak içerik toplamalarını sağlayan bir SaaS (Hizmet Olarak Yazılım)
  platformudur. "Kişisel haber asistanı" olarak konumlandırılmıştır.

  Temel Değer Önerisi

  - Kod yazmadan, görsel bir arayüz üzerinden haber sitelerini tanımlama
  - Arka planda otomatik tarama ile "kur ve unut" deneyimi
  - Reklamsız, temiz okuma deneyimi
  - %100 kullanıcı kontrolünde içerik seçimi

  ---
  Teknoloji Yığını (Tech Stack v1.2)

  | Katman     | Teknoloji                                             |
  |------------|-------------------------------------------------------|
  | Backend    | NestJS + TypeScript + Prisma ORM                      |
  | Frontend   | Next.js 14/15 (App Router) + Tailwind CSS + shadcn/ui |
  | Veritabanı | PostgreSQL 16                                         |
  | Kuyruk     | Redis + BullMQ                                        |
  | Crawler    | Playwright (Headless Chromium) + Cheerio              |
  | Auth       | Passport-JWT + Google OAuth                           |
  | E-posta    | Resend                                                |
  | Altyapı    | Docker + Coolify (VPS - Hetzner)                      |

  ---
  Mimari Yapı

  Kullanıcı → Frontend (Next.js) → Backend (NestJS API)
                                        ↓
                                  PostgreSQL (Veri)
                                        ↓
                                  Redis (Kuyruk)
                                        ↓
                                Playwright Worker (Crawler)
                                        ↓
                                İnternet (Haber Siteleri)

  ---
  Temel Özellikler

  1. Görsel Seçici (Visual Selector)
    - Proxy tabanlı HTML önizleme
    - Tıklayarak element seçimi (CSS/XPath)
    - ID → Unique Class → XPath şelale stratejisi
  2. Crawler Motoru
    - BullMQ ile iş kuyruğu
    - Playwright ile headless tarama
    - Stealth plugin ile bot koruması aşma
    - Hash tabanlı mükerrer önleme
  3. İçerik Yönetimi
    - Hotlink ile resim gösterimi (sunucuya indirmeden)
    - Agresif HTML sanitizasyonu
    - 30 günlük veri saklama (otomatik temizlik)

  ---
  Veritabanı Şeması

  | Tablo    | Açıklama                                                         |
  |----------|------------------------------------------------------------------|
  | User     | Kullanıcılar (email, passwordHash, googleId, role)               |
  | Source   | Haber kaynakları (url, selectors JSONB, refreshInterval, status) |
  | Article  | Haberler (title, content, imageUrl, hash, isRead, isPartial)     |
  | CrawlJob | Tarama işleri (status, itemsFound, itemsInserted, errorMessage)  |

  ---
  API Endpoint'leri

  - POST /auth/register - Kayıt
  - POST /auth/login - Giriş
  - GET /auth/google - Google OAuth
  - GET /sources - Kaynakları listele
  - POST /sources - Kaynak ekle
  - POST /sources/:id/crawl - Manuel tarama tetikle
  - GET /articles - Haberleri listele (pagination)
  - PATCH /articles/:id/read - Okundu işaretle
  - GET /proxy?url=... - HTML proxy servisi

  ---
  Proje Yapısı (Monorepo-Lite)

  octopus-saas/
  ├── backend/           # NestJS Projesi
  │   ├── src/
  │   │   ├── modules/   # auth, crawler, sources, proxy
  │   │   ├── common/    # Guards, Interceptors
  │   │   └── prisma/    # DB Şeması
  ├── frontend/          # Next.js Projesi
  │   ├── src/
  │   │   ├── app/       # Sayfalar (App Router)
  │   │   ├── components/# shadcn/ui bileşenleri
  │   │   └── hooks/     # React Query hooks
  ├── docs/              # Dokümantasyon
  └── docker-compose.yml # Local dev altyapısı

  ---
  Geliştirme Yol Haritası (5 Hafta)

  | Faz   | Hedef                                  |
  |-------|----------------------------------------|
  | Faz 1 | Altyapı, DB, Proxy Servisi             |
  | Faz 2 | Frontend & Görsel Seçici Sihirbazı     |
  | Faz 3 | Crawler Motoru & İş Kuyruğu            |
  | Faz 4 | UI, İçerik Yönetimi, Temizlik Job'ları |
  | Faz 5 | Test, Deployment, Launch               |

  ---
  İş Hedefleri

  - İlk 3 ayda 100 aktif kullanıcı (ücretsiz)
  - 6 ayda ilk ücretli paket
  - Destek taleplerinin %90'ını 48 saat içinde çözme
  - Bulut maliyetlerini aylık 250 USD altında tutma

  ---
  Tasarım Sistemi

  - Renk: Blue-600 (Primary) + Slate tonları
  - Font: Inter (Sans-serif)
  - UI Kit: shadcn/ui (New York style, Slate base)
  - Köşe: 0.5rem (rounded-md)
  - Ton: Profesyonel, net, yardımcı (aşırı samimi değil)

  ---