ALTER TABLE "announcements"
  ADD COLUMN IF NOT EXISTS "gradeId" TEXT,
  ADD COLUMN IF NOT EXISTS "sectionId" TEXT,
  ADD COLUMN IF NOT EXISTS "createdById" TEXT,
  ADD COLUMN IF NOT EXISTS "createdByRole" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "announcements_tenantId_gradeId_idx"
  ON "announcements"("tenantId", "gradeId");

CREATE INDEX IF NOT EXISTS "announcements_tenantId_sectionId_idx"
  ON "announcements"("tenantId", "sectionId");

CREATE INDEX IF NOT EXISTS "announcements_tenantId_createdById_idx"
  ON "announcements"("tenantId", "createdById");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'announcements_gradeId_fkey'
  ) THEN
    ALTER TABLE "announcements"
      ADD CONSTRAINT "announcements_gradeId_fkey"
      FOREIGN KEY ("gradeId") REFERENCES "grades"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'announcements_sectionId_fkey'
  ) THEN
    ALTER TABLE "announcements"
      ADD CONSTRAINT "announcements_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "sections"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'announcements_createdById_fkey'
  ) THEN
    ALTER TABLE "announcements"
      ADD CONSTRAINT "announcements_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
