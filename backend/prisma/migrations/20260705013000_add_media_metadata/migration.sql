ALTER TABLE "ProductImage"
  ADD COLUMN IF NOT EXISTS "thumbUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "cardUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "detailUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "originalUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "bucket" TEXT,
  ADD COLUMN IF NOT EXISTS "storagePath" TEXT,
  ADD COLUMN IF NOT EXISTS "mimeType" TEXT,
  ADD COLUMN IF NOT EXISTS "width" INTEGER,
  ADD COLUMN IF NOT EXISTS "height" INTEGER,
  ADD COLUMN IF NOT EXISTS "sizeBytes" INTEGER,
  ADD COLUMN IF NOT EXISTS "storageProvider" TEXT DEFAULT 'LEGACY',
  ADD COLUMN IF NOT EXISTS "storageStatus" TEXT DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "isPrimary" BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS "ProductImage_productId_active_sortOrder_idx"
  ON "ProductImage"("productId", "active", "sortOrder");

CREATE INDEX IF NOT EXISTS "ProductImage_storageStatus_idx"
  ON "ProductImage"("storageStatus");
