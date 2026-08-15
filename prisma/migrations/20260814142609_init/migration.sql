-- CreateEnum
CREATE TYPE "Objetivo" AS ENUM ('hipertrofia', 'fuerza', 'descenso');

-- CreateEnum
CREATE TYPE "Nivel" AS ENUM ('principiante', 'intermedio', 'avanzado');

-- CreateEnum
CREATE TYPE "Modalidad" AS ENUM ('gimnasio', 'casa');

-- CreateEnum
CREATE TYPE "RoutineStatus" AS ENUM ('active', 'historic');

-- CreateTable
CREATE TABLE "trainers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "objetivo" "Objetivo",
    "nivel" "Nivel",
    "modalidad" "Modalidad",
    "payment_expires_at" DATE,
    "health_notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primary_muscle" TEXT NOT NULL,
    "secondary_muscle" TEXT,
    "video_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_weeks" INTEGER NOT NULL DEFAULT 4,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routine_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_days" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "day_order" INTEGER NOT NULL,

    CONSTRAINT "training_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_blocks" (
    "id" TEXT NOT NULL,
    "training_day_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER,
    "duration_secs" INTEGER,
    "rest_secs" INTEGER,
    "trainer_notes" TEXT,
    "block_order" INTEGER NOT NULL,

    CONSTRAINT "exercise_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assigned_routines" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "status" "RoutineStatus" NOT NULL DEFAULT 'active',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "assigned_routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_overrides" (
    "id" TEXT NOT NULL,
    "assigned_routine_id" TEXT NOT NULL,
    "exercise_block_id" TEXT NOT NULL,
    "sets" INTEGER,
    "reps" INTEGER,
    "duration_secs" INTEGER,
    "rest_secs" INTEGER,
    "trainer_notes" TEXT,

    CONSTRAINT "routine_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_logs" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "assigned_routine_id" TEXT NOT NULL,
    "exercise_block_id" TEXT NOT NULL,
    "logged_date" DATE NOT NULL,
    "weight_kg" DECIMAL(6,2),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "student_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trainers_email_key" ON "trainers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_dni_key" ON "students"("dni");

-- CreateIndex
CREATE INDEX "idx_students_dni" ON "students"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_name_key" ON "exercises"("name");

-- CreateIndex
CREATE INDEX "idx_assigned_routines_student_status" ON "assigned_routines"("student_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "idx_one_active_per_student" ON "assigned_routines"("student_id");

-- CreateIndex
CREATE INDEX "idx_progress_student_date" ON "progress_logs"("student_id", "logged_date");

-- CreateIndex
CREATE UNIQUE INDEX "progress_logs_student_id_exercise_block_id_logged_date_key" ON "progress_logs"("student_id", "exercise_block_id", "logged_date");

-- AddForeignKey
ALTER TABLE "training_days" ADD CONSTRAINT "training_days_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "routine_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_blocks" ADD CONSTRAINT "exercise_blocks_training_day_id_fkey" FOREIGN KEY ("training_day_id") REFERENCES "training_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_blocks" ADD CONSTRAINT "exercise_blocks_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assigned_routines" ADD CONSTRAINT "assigned_routines_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assigned_routines" ADD CONSTRAINT "assigned_routines_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "routine_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_overrides" ADD CONSTRAINT "routine_overrides_assigned_routine_id_fkey" FOREIGN KEY ("assigned_routine_id") REFERENCES "assigned_routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_overrides" ADD CONSTRAINT "routine_overrides_exercise_block_id_fkey" FOREIGN KEY ("exercise_block_id") REFERENCES "exercise_blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_logs" ADD CONSTRAINT "progress_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_logs" ADD CONSTRAINT "progress_logs_assigned_routine_id_fkey" FOREIGN KEY ("assigned_routine_id") REFERENCES "assigned_routines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_logs" ADD CONSTRAINT "progress_logs_exercise_block_id_fkey" FOREIGN KEY ("exercise_block_id") REFERENCES "exercise_blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
