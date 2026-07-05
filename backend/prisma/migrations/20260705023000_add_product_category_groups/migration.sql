CREATE TABLE IF NOT EXISTS "ProductCategoryGroup" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "slug" TEXT NOT NULL UNIQUE,
  "nameVi" TEXT NOT NULL,
  "nameEn" TEXT,
  "description" TEXT,
  "imageUrl" TEXT,
  "icon" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "ProductCategory"
  ADD COLUMN IF NOT EXISTS "categoryGroupId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ProductCategory_categoryGroupId_fkey'
  ) THEN
    ALTER TABLE "ProductCategory"
      ADD CONSTRAINT "ProductCategory_categoryGroupId_fkey"
      FOREIGN KEY ("categoryGroupId") REFERENCES "ProductCategoryGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ProductCategory_categoryGroupId_active_sortOrder_idx"
  ON "ProductCategory"("categoryGroupId", "active", "sortOrder");

CREATE INDEX IF NOT EXISTS "ProductCategoryGroup_active_sortOrder_idx"
  ON "ProductCategoryGroup"("active", "sortOrder");

INSERT INTO "ProductCategoryGroup" ("id", "code", "slug", "nameVi", "nameEn", "sortOrder")
VALUES
  ('catgrp-gunpla-gundam', 'GUNPLA_GUNDAM', 'gunpla-gundam', 'GUNPLA - GUNDAM', 'GUNPLA - GUNDAM', 10),
  ('catgrp-30-minutes-label', 'THIRTY_MINUTES_LABEL', '30-minutes-label', '30 Minutes Label', '30 Minutes Label', 20),
  ('catgrp-pokemon-plamo', 'POKEMON_PLAMO', 'pokemon-plamo', 'Pokémon PLAMO COLLECTION', 'Pokémon PLAMO COLLECTION', 30),
  ('catgrp-armored-core', 'ARMORED_CORE', 'armored-core', 'Armored Core VI Fires of Rubicon', 'Armored Core VI Fires of Rubicon', 40),
  ('catgrp-keroro', 'KERORO', 'keroro', 'Sgt. Frog - Keroro Gunso', 'Sgt. Frog - Keroro Gunso', 50),
  ('catgrp-tools-paint-accessories', 'TOOLS_PAINT_ACCESSORIES', 'tools-paint-accessories', 'Tools / Paint / Accessories', 'Tools / Paint / Accessories', 60)
ON CONFLICT ("code") DO UPDATE SET
  "nameVi" = EXCLUDED."nameVi",
  "nameEn" = EXCLUDED."nameEn",
  "sortOrder" = EXCLUDED."sortOrder";

UPDATE "ProductCategory"
SET "categoryGroupId" = 'catgrp-gunpla-gundam'
WHERE "categoryGroupId" IS NULL
  AND LOWER(CONCAT_WS(' ', "code", "slug", "nameVi", COALESCE("nameEn", ''))) ~ '(gunpla|gundam|master grade|real grade|high grade|perfect grade|(^|_)mg($|_)|(^|_)rg($|_)|(^|_)hg($|_)|(^|_)pg($|_)|option parts)';

UPDATE "ProductCategory"
SET "categoryGroupId" = 'catgrp-30-minutes-label'
WHERE "categoryGroupId" IS NULL
  AND LOWER(CONCAT_WS(' ', "code", "slug", "nameVi", COALESCE("nameEn", ''))) ~ '(30 minutes|30mm|30ms|30mf|sisters|missions|fantasy)';

UPDATE "ProductCategory"
SET "categoryGroupId" = 'catgrp-pokemon-plamo'
WHERE "categoryGroupId" IS NULL
  AND LOWER(CONCAT_WS(' ', "code", "slug", "nameVi", COALESCE("nameEn", ''))) ~ '(pokemon|pokémon|plamo)';

UPDATE "ProductCategory"
SET "categoryGroupId" = 'catgrp-armored-core'
WHERE "categoryGroupId" IS NULL
  AND LOWER(CONCAT_WS(' ', "code", "slug", "nameVi", COALESCE("nameEn", ''))) ~ '(armored core|rubicon)';

UPDATE "ProductCategory"
SET "categoryGroupId" = 'catgrp-keroro'
WHERE "categoryGroupId" IS NULL
  AND LOWER(CONCAT_WS(' ', "code", "slug", "nameVi", COALESCE("nameEn", ''))) ~ '(keroro|sgt|frog|gunso)';

UPDATE "ProductCategory"
SET "categoryGroupId" = 'catgrp-tools-paint-accessories'
WHERE "categoryGroupId" IS NULL
  AND LOWER(CONCAT_WS(' ', "code", "slug", "nameVi", COALESCE("nameEn", ''))) ~ '(tool|paint|sơn|accessor|phụ kiện|decal|stand|base)';
