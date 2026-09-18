-- DropIndex
DROP INDEX "exercises_name_key";

-- DropIndex
DROP INDEX "idx_students_dni";

-- AlterTable
ALTER TABLE "exercises" ADD COLUMN     "trainer_id" TEXT;

-- AlterTable
ALTER TABLE "trainers" ADD COLUMN     "max_plans" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "max_students" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "membership_expires_at" DATE,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "idx_exercises_trainer" ON "exercises"("trainer_id");

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
