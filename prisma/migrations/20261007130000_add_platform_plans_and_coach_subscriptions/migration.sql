-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "trainers" ADD COLUMN IF NOT EXISTS "platform_plan_id" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "platform_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "duration_days" INTEGER NOT NULL DEFAULT 30,
    "max_students" INTEGER NOT NULL DEFAULT 10,
    "max_plans" INTEGER NOT NULL DEFAULT 1,
    "max_generic_profiles" INTEGER NOT NULL DEFAULT 3,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "platform_plans_name_key" ON "platform_plans"("name");

-- CreateTable
CREATE TABLE IF NOT EXISTS "trainer_subscriptions" (
    "id" TEXT NOT NULL,
    "trainer_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "price_snapshot" DECIMAL(10,2) NOT NULL,
    "start_date" DATE NOT NULL,
    "expires_at" DATE NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainer_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_trainer_subscriptions_status" ON "trainer_subscriptions"("trainer_id", "status");

-- CreateTable
CREATE TABLE IF NOT EXISTS "trainer_payments" (
    "id" TEXT NOT NULL,
    "trainer_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "paid_at" DATE NOT NULL,
    "payment_method" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainer_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_trainer_payments_trainer" ON "trainer_payments"("trainer_id");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "trainers" ADD CONSTRAINT "trainers_platform_plan_id_fkey" FOREIGN KEY ("platform_plan_id") REFERENCES "platform_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "trainer_subscriptions" ADD CONSTRAINT "trainer_subscriptions_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "trainer_subscriptions" ADD CONSTRAINT "trainer_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "platform_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "trainer_payments" ADD CONSTRAINT "trainer_payments_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "trainer_payments" ADD CONSTRAINT "trainer_payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "trainer_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
