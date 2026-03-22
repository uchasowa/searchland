ALTER TABLE "feedback" ADD COLUMN IF NOT EXISTS "company" text;
ALTER TABLE "feedback" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "feedback" ADD COLUMN IF NOT EXISTS "notes" text;
