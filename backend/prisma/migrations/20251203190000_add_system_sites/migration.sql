-- Delete all system sources except Anadolu Ajansı
DELETE FROM "sources"
WHERE "isSystem" = true
AND "name" NOT LIKE 'Anadolu Ajansı%';

-- AlterTable: Add isSystem column to sites
ALTER TABLE "sites" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Make userId nullable for system sites
ALTER TABLE "sites" ALTER COLUMN "userId" DROP NOT NULL;

-- Drop old unique constraint (userId, domain)
ALTER TABLE "sites" DROP CONSTRAINT IF EXISTS "sites_userId_domain_key";

-- Create new unique constraint on domain only
ALTER TABLE "sites" ADD CONSTRAINT "sites_domain_key" UNIQUE ("domain");

-- CreateIndex: Add index for isSystem
CREATE INDEX "sites_isSystem_idx" ON "sites"("isSystem");

-- Update all existing sites to be system sites
UPDATE "sites" SET "isSystem" = true, "userId" = NULL;
