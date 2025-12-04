-- Migration: Son Dakika ve Tüm Haberler sistem kategorilerini ekle

INSERT INTO "categories" ("id", "name", "icon", "color", "isSystem", "userId", "createdAt") VALUES
  (gen_random_uuid(), 'Son Dakika', 'alert-triangle', '#f59e0b', true, NULL, NOW()),
  (gen_random_uuid(), 'Tüm Haberler', 'globe', '#3b82f6', true, NULL, NOW());
