-- Migration: Genel ve Diğer sistem kategorilerini ekle

INSERT INTO "categories" ("id", "name", "icon", "color", "isSystem", "userId", "createdAt") VALUES
  (gen_random_uuid(), 'Genel', 'folder', '#6b7280', true, NULL, NOW()),
  (gen_random_uuid(), 'Diger', 'more-horizontal', '#9ca3af', true, NULL, NOW());
