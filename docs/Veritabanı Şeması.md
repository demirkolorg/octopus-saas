generator client { provider \= "prisma-client-js" }

datasource db { provider \= "postgresql" url \= env("DATABASE\_URL") }

// \--- ENUMS \---

enum Role { USER ADMIN }

enum SourceStatus { ACTIVE PAUSED ERROR }

enum JobStatus { PENDING RUNNING COMPLETED FAILED }

// \--- MODELS \---

model User { id String @id @default(uuid()) email String @unique passwordHash String? // Nullable because OAuth users won't have a password googleId String? @unique role Role @default(USER)

createdAt DateTime @default(now()) updatedAt DateTime @updatedAt

sources Source\[\] }

model Source { id String @id @default(uuid()) name String url String

userId String user User @relation(fields: \[userId\], references: \[id\])

// Stores CSS/XPath selectors (e.g., { title: ".h1", content: "\#body" }) selectors Json

refreshInterval Int @default(900) // Default: 15 minutes (in seconds) status SourceStatus @default(ACTIVE) lastCrawlAt DateTime?

createdAt DateTime @default(now()) updatedAt DateTime @updatedAt

articles Article\[\] crawlJobs CrawlJob\[\]

@@index(\[userId\]) // Optimization for listing user sources }

model Article { id String @id @default(uuid()) sourceId String source Source @relation(fields: \[sourceId\], references: \[id\], onDelete: Cascade)

title String content String @db.Text summary String? @db.Text url String imageUrl String?

isRead Boolean @default(false) isPartial Boolean @default(false) // If crawling failed but title was found

// Deduplication hash (SHA256 of sourceId \+ url) hash String @unique

publishedAt DateTime? createdAt DateTime @default(now()) // Critical for 30-day retention policy

// Composite index for dashboard performance (Filtering by source \+ sorting by date) @@index(\[sourceId, createdAt\]) // Index for the retention cleanup job @@index(\[createdAt\]) }

model CrawlJob { id String @id @default(uuid()) sourceId String source Source @relation(fields: \[sourceId\], references: \[id\], onDelete: Cascade) status JobStatus @default(PENDING)

itemsFound Int @default(0) itemsInserted Int @default(0) errorMessage String? // Stores error details if status is FAILED

startedAt DateTime @default(now()) finishedAt DateTime?

@@index(\[sourceId\]) }

