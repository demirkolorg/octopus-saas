-- CreateTable
CREATE TABLE "article_groups" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "imageUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_groups_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add new columns to articles
ALTER TABLE "articles" ADD COLUMN "groupId" TEXT;
ALTER TABLE "articles" ADD COLUMN "urlHash" TEXT;
ALTER TABLE "articles" ADD COLUMN "similarityScore" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "articles_groupId_idx" ON "articles"("groupId");

-- CreateIndex: Unique constraint for sourceId + urlHash (nullable safe)
CREATE UNIQUE INDEX "articles_sourceId_urlHash_key" ON "articles"("sourceId", "urlHash") WHERE "urlHash" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "article_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
