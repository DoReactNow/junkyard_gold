-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "consentAt" TIMESTAMP(3),
ADD COLUMN     "consentIp" TEXT,
ADD COLUMN     "consentText" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "error" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Message_status_scheduledAt_idx" ON "Message"("status", "scheduledAt");

-- Carry over v1's opt-out list when this runs on the v1 database (same Postgres, v1 tables live in "public",
-- v2's tables in the "app" schema).
-- On a fresh database the table doesn't exist and this does nothing.
DO $$
BEGIN
  IF to_regclass('public.optouts') IS NOT NULL THEN
    INSERT INTO "Conversation" ("id", "phone", "optedOut", "unread", "lastMessageAt", "createdAt")
    SELECT 'v1optout_' || md5(o.phone), o.phone, true, false, o.created_at, o.created_at
    FROM public.optouts o
    ON CONFLICT ("phone") DO UPDATE SET "optedOut" = true;
  END IF;
END $$;
