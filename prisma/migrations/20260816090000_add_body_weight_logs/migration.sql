-- CreateTable
CREATE TABLE "body_weight_logs" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "logged_date" DATE NOT NULL,
    "weight_kg" DECIMAL(6,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_weight_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_body_weight_student_date" ON "body_weight_logs"("student_id", "logged_date");

-- CreateIndex
CREATE UNIQUE INDEX "unique_body_weight_per_day" ON "body_weight_logs"("student_id", "logged_date");

-- AddForeignKey
ALTER TABLE "body_weight_logs" ADD CONSTRAINT "body_weight_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
