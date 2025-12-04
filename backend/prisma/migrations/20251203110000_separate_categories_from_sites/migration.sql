-- Migration: Kategorileri sitelerden ayır
-- Kategoriler artık site'ye bağlı değil, kullanıcıya bağlı veya sistem kategorisi

-- Önce sources'daki kategori referanslarını temizle
UPDATE "sources" SET "categoryId" = NULL WHERE "categoryId" IS NOT NULL;

-- Mevcut kategorileri temizle (test verileri)
DELETE FROM "categories";

-- siteId foreign key constraint'i kaldır
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_siteId_fkey";

-- siteId_name unique constraint'i kaldır
DROP INDEX IF EXISTS "categories_siteId_name_key";

-- siteId index'i kaldır
DROP INDEX IF EXISTS "categories_siteId_idx";

-- siteId column'u kaldır
ALTER TABLE "categories" DROP COLUMN IF EXISTS "siteId";

-- userId column ekle (nullable - sistem kategorileri için)
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- isSystem column ekle
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- userId foreign key constraint ekle
ALTER TABLE "categories" ADD CONSTRAINT "categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- userId + name unique constraint ekle
ALTER TABLE "categories" ADD CONSTRAINT "categories_userId_name_key" UNIQUE ("userId", "name");

-- userId index ekle
CREATE INDEX IF NOT EXISTS "categories_userId_idx" ON "categories"("userId");

-- isSystem index ekle
CREATE INDEX IF NOT EXISTS "categories_isSystem_idx" ON "categories"("isSystem");

-- Varsayılan sistem kategorilerini ekle
INSERT INTO "categories" ("id", "name", "icon", "color", "isSystem", "userId", "createdAt") VALUES
  (gen_random_uuid(), 'Gündem', 'newspaper', '#3b82f6', true, NULL, NOW()),
  (gen_random_uuid(), 'Ekonomi', 'trending-up', '#22c55e', true, NULL, NOW()),
  (gen_random_uuid(), 'Spor', 'trophy', '#f59e0b', true, NULL, NOW()),
  (gen_random_uuid(), 'Teknoloji', 'cpu', '#8b5cf6', true, NULL, NOW()),
  (gen_random_uuid(), 'Sağlık', 'heart-pulse', '#ef4444', true, NULL, NOW()),
  (gen_random_uuid(), 'Kültür & Sanat', 'palette', '#ec4899', true, NULL, NOW()),
  (gen_random_uuid(), 'Dünya', 'globe', '#06b6d4', true, NULL, NOW()),
  (gen_random_uuid(), 'Siyaset', 'landmark', '#64748b', true, NULL, NOW()),
  (gen_random_uuid(), 'Eğitim', 'graduation-cap', '#f97316', true, NULL, NOW()),
  (gen_random_uuid(), 'Bilim', 'flask-conical', '#14b8a6', true, NULL, NOW()),
  (gen_random_uuid(), 'Magazin', 'sparkles', '#d946ef', true, NULL, NOW()),
  (gen_random_uuid(), 'Otomobil', 'car', '#71717a', true, NULL, NOW());
