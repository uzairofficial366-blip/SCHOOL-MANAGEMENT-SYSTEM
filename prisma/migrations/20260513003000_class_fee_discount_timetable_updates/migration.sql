ALTER TYPE "ExamType" ADD VALUE IF NOT EXISTS 'PRE_BOARD';

ALTER TABLE "fee_structures"
  ADD COLUMN IF NOT EXISTS "gradeId" TEXT;

ALTER TABLE "fee_payments"
  ADD COLUMN IF NOT EXISTS "discountRemarks" TEXT;

CREATE INDEX IF NOT EXISTS "fee_structures_tenantId_gradeId_idx"
  ON "fee_structures"("tenantId", "gradeId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fee_structures_gradeId_fkey'
  ) THEN
    ALTER TABLE "fee_structures"
      ADD CONSTRAINT "fee_structures_gradeId_fkey"
      FOREIGN KEY ("gradeId") REFERENCES "grades"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
