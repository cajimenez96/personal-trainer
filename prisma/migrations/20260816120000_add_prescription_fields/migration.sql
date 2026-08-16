-- AlterTable
ALTER TABLE "exercise_blocks"
    ADD COLUMN "reps_scheme" TEXT,
    ADD COLUMN "weight_kg" DECIMAL(6,2),
    ADD COLUMN "intensity" TEXT;

-- AlterTable
ALTER TABLE "routine_overrides"
    ADD COLUMN "reps_scheme" TEXT,
    ADD COLUMN "weight_kg" DECIMAL(6,2),
    ADD COLUMN "intensity" TEXT;
