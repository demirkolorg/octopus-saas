-- AlterTable: Add isSystem column to sources
ALTER TABLE "sources" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Make userId nullable for system sources
ALTER TABLE "sources" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex: Add index for isSystem
CREATE INDEX "sources_isSystem_idx" ON "sources"("isSystem");

-- Create system sites first (they will be shared)
INSERT INTO "sites" ("id", "name", "domain", "logoUrl", "siteType", "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Anadolu Ajansı',
  'aa.com.tr',
  'https://www.aa.com.tr/favicon.ico',
  'AGENCY',
  (SELECT id FROM "users" LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sites" WHERE "domain" = 'aa.com.tr')
ON CONFLICT DO NOTHING;

INSERT INTO "sites" ("id", "name", "domain", "logoUrl", "siteType", "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'NTV',
  'ntv.com.tr',
  'https://www.ntv.com.tr/favicon.ico',
  'NATIONAL',
  (SELECT id FROM "users" LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sites" WHERE "domain" = 'ntv.com.tr')
ON CONFLICT DO NOTHING;

INSERT INTO "sites" ("id", "name", "domain", "logoUrl", "siteType", "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Hürriyet',
  'hurriyet.com.tr',
  'https://www.hurriyet.com.tr/favicon.ico',
  'NATIONAL',
  (SELECT id FROM "users" LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sites" WHERE "domain" = 'hurriyet.com.tr')
ON CONFLICT DO NOTHING;

INSERT INTO "sites" ("id", "name", "domain", "logoUrl", "siteType", "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Sözcü',
  'sozcu.com.tr',
  'https://www.sozcu.com.tr/favicon.ico',
  'NATIONAL',
  (SELECT id FROM "users" LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sites" WHERE "domain" = 'sozcu.com.tr')
ON CONFLICT DO NOTHING;

INSERT INTO "sites" ("id", "name", "domain", "logoUrl", "siteType", "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Habertürk',
  'haberturk.com',
  'https://www.haberturk.com/favicon.ico',
  'NATIONAL',
  (SELECT id FROM "users" LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sites" WHERE "domain" = 'haberturk.com')
ON CONFLICT DO NOTHING;

INSERT INTO "sites" ("id", "name", "domain", "logoUrl", "siteType", "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'CNN Türk',
  'cnnturk.com',
  'https://www.cnnturk.com/favicon.ico',
  'NATIONAL',
  (SELECT id FROM "users" LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sites" WHERE "domain" = 'cnnturk.com')
ON CONFLICT DO NOTHING;

INSERT INTO "sites" ("id", "name", "domain", "logoUrl", "siteType", "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'TRT Haber',
  'trthaber.com',
  'https://www.trthaber.com/favicon.ico',
  'NATIONAL',
  (SELECT id FROM "users" LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sites" WHERE "domain" = 'trthaber.com')
ON CONFLICT DO NOTHING;

INSERT INTO "sites" ("id", "name", "domain", "logoUrl", "siteType", "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Milliyet',
  'milliyet.com.tr',
  'https://www.milliyet.com.tr/favicon.ico',
  'NATIONAL',
  (SELECT id FROM "users" LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sites" WHERE "domain" = 'milliyet.com.tr')
ON CONFLICT DO NOTHING;

INSERT INTO "sites" ("id", "name", "domain", "logoUrl", "siteType", "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Sabah',
  'sabah.com.tr',
  'https://www.sabah.com.tr/favicon.ico',
  'NATIONAL',
  (SELECT id FROM "users" LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sites" WHERE "domain" = 'sabah.com.tr')
ON CONFLICT DO NOTHING;

INSERT INTO "sites" ("id", "name", "domain", "logoUrl", "siteType", "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Sondakika.com',
  'sondakika.com',
  'https://www.sondakika.com/favicon.ico',
  'NATIONAL',
  (SELECT id FROM "users" LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sites" WHERE "domain" = 'sondakika.com')
ON CONFLICT DO NOTHING;

INSERT INTO "sites" ("id", "name", "domain", "logoUrl", "siteType", "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'BBC Türkçe',
  'bbc.com',
  'https://www.bbc.com/favicon.ico',
  'NATIONAL',
  (SELECT id FROM "users" LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sites" WHERE "domain" = 'bbc.com')
ON CONFLICT DO NOTHING;

INSERT INTO "sites" ("id", "name", "domain", "logoUrl", "siteType", "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'DW Türkçe',
  'dw.com',
  'https://www.dw.com/favicon.ico',
  'NATIONAL',
  (SELECT id FROM "users" LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sites" WHERE "domain" = 'dw.com')
ON CONFLICT DO NOTHING;

-- Now create system sources (RSS feeds)
-- These will be visible to all users

-- Anadolu Ajansı RSS
INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Anadolu Ajansı - Gündem',
  'https://www.aa.com.tr',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'aa.com.tr' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Gündem' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://www.aa.com.tr/tr/rss/default?cat=guncel',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://www.aa.com.tr/tr/rss/default?cat=guncel');

-- NTV RSS
INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'NTV - Son Dakika',
  'https://www.ntv.com.tr',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'ntv.com.tr' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Son Dakika' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://www.ntv.com.tr/son-dakika.rss',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://www.ntv.com.tr/son-dakika.rss');

-- Hürriyet RSS
INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Hürriyet - Gündem',
  'https://www.hurriyet.com.tr',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'hurriyet.com.tr' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Gündem' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://www.hurriyet.com.tr/rss/gundem',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://www.hurriyet.com.tr/rss/gundem');

-- Sözcü RSS
INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Sözcü - Gündem',
  'https://www.sozcu.com.tr',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'sozcu.com.tr' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Gündem' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://www.sozcu.com.tr/rss/gundem.xml',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://www.sozcu.com.tr/rss/gundem.xml');

-- Habertürk RSS
INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Habertürk - Gündem',
  'https://www.haberturk.com',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'haberturk.com' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Gündem' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://www.haberturk.com/rss/gundem.xml',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://www.haberturk.com/rss/gundem.xml');

-- CNN Türk RSS
INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'CNN Türk - Gündem',
  'https://www.cnnturk.com',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'cnnturk.com' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Gündem' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://www.cnnturk.com/feed/rss/all/news',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://www.cnnturk.com/feed/rss/all/news');

-- TRT Haber RSS
INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'TRT Haber - Gündem',
  'https://www.trthaber.com',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'trthaber.com' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Gündem' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://www.trthaber.com/sondakika.rss',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://www.trthaber.com/sondakika.rss');

-- BBC Türkçe RSS
INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'BBC Türkçe',
  'https://www.bbc.com/turkce',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'bbc.com' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Gündem' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://feeds.bbci.co.uk/turkce/rss.xml',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://feeds.bbci.co.uk/turkce/rss.xml');

-- DW Türkçe RSS
INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'DW Türkçe',
  'https://www.dw.com/tr',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'dw.com' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Gündem' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://rss.dw.com/rdf/rss-tur-all',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://rss.dw.com/rdf/rss-tur-all');

-- Sondakika.com RSS
INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Sondakika.com - Son Dakika',
  'https://www.sondakika.com',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'sondakika.com' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Son Dakika' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://www.sondakika.com/rss/',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://www.sondakika.com/rss/');

-- Milliyet RSS
INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Milliyet - Gündem',
  'https://www.milliyet.com.tr',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'milliyet.com.tr' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Gündem' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://www.milliyet.com.tr/rss/rssNew/gundemRss.xml',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://www.milliyet.com.tr/rss/rssNew/gundemRss.xml');

-- Sabah RSS
INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Sabah - Gündem',
  'https://www.sabah.com.tr',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'sabah.com.tr' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Gündem' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://www.sabah.com.tr/rss/gundem.xml',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://www.sabah.com.tr/rss/gundem.xml');

-- Spor kaynakları
INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'NTV - Spor',
  'https://www.ntv.com.tr/spor',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'ntv.com.tr' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Spor' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://www.ntv.com.tr/spor.rss',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://www.ntv.com.tr/spor.rss');

INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Hürriyet - Spor',
  'https://www.hurriyet.com.tr/sporarena',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'hurriyet.com.tr' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Spor' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://www.hurriyet.com.tr/rss/spor',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://www.hurriyet.com.tr/rss/spor');

-- Ekonomi kaynakları
INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'NTV - Ekonomi',
  'https://www.ntv.com.tr/ekonomi',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'ntv.com.tr' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Ekonomi' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://www.ntv.com.tr/ekonomi.rss',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://www.ntv.com.tr/ekonomi.rss');

INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Hürriyet - Ekonomi',
  'https://www.hurriyet.com.tr/ekonomi',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'hurriyet.com.tr' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Ekonomi' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://www.hurriyet.com.tr/rss/ekonomi',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://www.hurriyet.com.tr/rss/ekonomi');

-- Teknoloji kaynakları
INSERT INTO "sources" ("id", "name", "url", "sourceType", "isSystem", "siteId", "categoryId", "userId", "feedUrl", "refreshInterval", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'NTV - Teknoloji',
  'https://www.ntv.com.tr/teknoloji',
  'RSS',
  true,
  (SELECT id FROM "sites" WHERE "domain" = 'ntv.com.tr' LIMIT 1),
  (SELECT id FROM "categories" WHERE "name" = 'Teknoloji' AND "isSystem" = true LIMIT 1),
  NULL,
  'https://www.ntv.com.tr/teknoloji.rss',
  900,
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sources" WHERE "feedUrl" = 'https://www.ntv.com.tr/teknoloji.rss');
