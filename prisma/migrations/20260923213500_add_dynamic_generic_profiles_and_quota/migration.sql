-- DropIndex
DROP INDEX IF EXISTS "generic_profiles_trainer_id_level_key";

-- AlterTable
ALTER TABLE "generic_profiles" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "name" TEXT,
ALTER COLUMN "level" DROP NOT NULL;

-- Backfill existing rows
UPDATE "generic_profiles" SET "name" = CASE
  WHEN "level"::text = 'basico' THEN 'Básico'
  WHEN "level"::text = 'intermedio' THEN 'Intermedio'
  WHEN "level"::text = 'avanzado' THEN 'Avanzado'
  ELSE 'Perfil Genérico'
END WHERE "name" IS NULL;

-- Fallback in case any is still null
UPDATE "generic_profiles" SET "name" = 'Perfil ' || substr("id", 1, 8) WHERE "name" IS NULL;

-- Set NOT NULL
ALTER TABLE "generic_profiles" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "trainers" ADD COLUMN IF NOT EXISTS "max_generic_profiles" INTEGER NOT NULL DEFAULT 3;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_generic_profiles_trainer" ON "generic_profiles"("trainer_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "generic_profiles_trainer_id_name_key" ON "generic_profiles"("trainer_id", "name");
