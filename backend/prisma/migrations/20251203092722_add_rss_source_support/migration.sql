-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('SELECTOR', 'RSS');

-- AlterTable
ALTER TABLE "sources" ADD COLUMN     "contentSelector" TEXT,
ADD COLUMN     "enrichContent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "feedMetadata" JSONB,
ADD COLUMN     "feedUrl" TEXT,
ADD COLUMN     "lastEtag" TEXT,
ADD COLUMN     "lastFeedModified" TEXT,
ADD COLUMN     "sourceType" "SourceType" NOT NULL DEFAULT 'SELECTOR',
ALTER COLUMN "selectors" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "sources_sourceType_idx" ON "sources"("sourceType");
