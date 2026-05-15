CREATE INDEX IF NOT EXISTS "guardians_tenantId_userId_idx"
  ON "guardians"("tenantId", "userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'guardians_userId_fkey'
  ) THEN
    ALTER TABLE "guardians"
      ADD CONSTRAINT "guardians_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
