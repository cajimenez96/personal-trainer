-- DropIndex
DROP INDEX "idx_one_active_per_student";

-- RN-04: at most one ACTIVE routine per student. A plain @@unique on
-- student_id can't express the WHERE clause, so it's declared here as raw
-- SQL instead of in schema.prisma.
CREATE UNIQUE INDEX "idx_one_active_per_student" ON "assigned_routines"("student_id") WHERE "status" = 'active';
