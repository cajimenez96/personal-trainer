-- CreateEnum
CREATE TYPE "GenericLevel" AS ENUM ('basico', 'intermedio', 'avanzado');

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_modalidad_id_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_objetivo_id_fkey";

-- CreateTable
CREATE TABLE "generic_profiles" (
    "id" TEXT NOT NULL,
    "level" "GenericLevel" NOT NULL,
    "password_hash" TEXT NOT NULL,
    "assigned_template_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generic_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "generic_profiles_level_key" ON "generic_profiles"("level");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_objetivo_id_fkey" FOREIGN KEY ("objetivo_id") REFERENCES "objetivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_modalidad_id_fkey" FOREIGN KEY ("modalidad_id") REFERENCES "modalidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generic_profiles" ADD CONSTRAINT "generic_profiles_assigned_template_id_fkey" FOREIGN KEY ("assigned_template_id") REFERENCES "routine_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "unique_body_weight_per_day" RENAME TO "body_weight_logs_student_id_logged_date_key";
