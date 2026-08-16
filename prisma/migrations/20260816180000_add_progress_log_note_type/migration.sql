-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('session', 'incident', 'discomfort');

-- AlterTable
ALTER TABLE "progress_logs" ADD COLUMN "note_type" "NoteType";
