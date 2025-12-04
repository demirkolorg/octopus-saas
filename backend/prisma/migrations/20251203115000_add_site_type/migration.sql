-- Migration: Site tipini ekle (Ulusal, Yerel, Haber Ajansı, Diğer)

-- SiteType enum oluştur
CREATE TYPE "SiteType" AS ENUM ('NATIONAL', 'LOCAL', 'AGENCY', 'OTHER');

-- sites tablosuna siteType column ekle
ALTER TABLE "sites" ADD COLUMN "siteType" "SiteType" NOT NULL DEFAULT 'OTHER';

-- siteType için index ekle
CREATE INDEX "sites_siteType_idx" ON "sites"("siteType");
