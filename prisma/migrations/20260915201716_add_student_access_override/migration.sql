-- CreateEnum
CREATE TYPE "AccessOverride" AS ENUM ('auto', 'allowed', 'blocked');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "access_override" "AccessOverride" NOT NULL DEFAULT 'auto';
