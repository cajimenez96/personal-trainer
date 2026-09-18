-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'COACH');

-- AlterTable: trainers
ALTER TABLE "trainers" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'COACH';
ALTER TABLE "trainers" ADD COLUMN "slug" TEXT;
ALTER TABLE "trainers" ADD COLUMN "business_name" TEXT;
ALTER TABLE "trainers" ADD COLUMN "headline" TEXT;
ALTER TABLE "trainers" ADD COLUMN "tagline" TEXT;
ALTER TABLE "trainers" ADD COLUMN "logo_url" TEXT;
ALTER TABLE "trainers" ADD COLUMN "hero_image_url" TEXT;
ALTER TABLE "trainers" ADD COLUMN "whatsapp_number" TEXT;
ALTER TABLE "trainers" ADD COLUMN "instagram_url" TEXT;
ALTER TABLE "trainers" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "trainers" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill slug for existing trainer(s)
UPDATE "trainers" SET "slug" = 'santiago-ramon' WHERE "slug" IS NULL;

-- Enforce NOT NULL and unique index on slug
ALTER TABLE "trainers" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "trainers_slug_key" ON "trainers"("slug");

-- AlterTable: students
ALTER TABLE "students" ADD COLUMN "trainer_id" TEXT;
UPDATE "students" SET "trainer_id" = (SELECT "id" FROM "trainers" LIMIT 1) WHERE "trainer_id" IS NULL;
ALTER TABLE "students" ALTER COLUMN "trainer_id" SET NOT NULL;

-- Drop old unique DNI index & create compound unique + query index
DROP INDEX IF EXISTS "students_dni_key";
CREATE UNIQUE INDEX "students_trainer_id_dni_key" ON "students"("trainer_id", "dni");
CREATE INDEX "idx_students_trainer_dni" ON "students"("trainer_id", "dni");
ALTER TABLE "students" ADD CONSTRAINT "students_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: plans
ALTER TABLE "plans" ADD COLUMN "trainer_id" TEXT;
UPDATE "plans" SET "trainer_id" = (SELECT "id" FROM "trainers" LIMIT 1) WHERE "trainer_id" IS NULL;
ALTER TABLE "plans" ALTER COLUMN "trainer_id" SET NOT NULL;

-- Drop old unique Plan Name index & create compound unique + query index
DROP INDEX IF EXISTS "plans_name_key";
CREATE UNIQUE INDEX "plans_trainer_id_name_key" ON "plans"("trainer_id", "name");
CREATE INDEX "idx_plans_trainer" ON "plans"("trainer_id");
ALTER TABLE "plans" ADD CONSTRAINT "plans_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: routine_templates
ALTER TABLE "routine_templates" ADD COLUMN "trainer_id" TEXT;
UPDATE "routine_templates" SET "trainer_id" = (SELECT "id" FROM "trainers" LIMIT 1) WHERE "trainer_id" IS NULL;
ALTER TABLE "routine_templates" ALTER COLUMN "trainer_id" SET NOT NULL;
CREATE INDEX "idx_routine_templates_trainer" ON "routine_templates"("trainer_id");
ALTER TABLE "routine_templates" ADD CONSTRAINT "routine_templates_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: generic_profiles
ALTER TABLE "generic_profiles" ADD COLUMN "trainer_id" TEXT;
UPDATE "generic_profiles" SET "trainer_id" = (SELECT "id" FROM "trainers" LIMIT 1) WHERE "trainer_id" IS NULL;
ALTER TABLE "generic_profiles" ALTER COLUMN "trainer_id" SET NOT NULL;

-- Drop old unique level index & create compound unique
DROP INDEX IF EXISTS "generic_profiles_level_key";
CREATE UNIQUE INDEX "generic_profiles_trainer_id_level_key" ON "generic_profiles"("trainer_id", "level");
ALTER TABLE "generic_profiles" ADD CONSTRAINT "generic_profiles_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
