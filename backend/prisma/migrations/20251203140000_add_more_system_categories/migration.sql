-- Migration: Son Dakika ve Tüm Haberler sistem kategorilerini ekle

INSERT INTO "categories" ("id", "name", "icon", "color", "isSystem", "userId", "createdAt") VALUES
  (gen_random_uuid(), 'Son Dakika', 'zap', '#dc2626', true, NULL, NOW()),
  (gen_random_uuid(), 'Tüm Haberler', 'layers', '#0ea5e9', true, NULL, NOW());
