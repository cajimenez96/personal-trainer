-- CreateTable
CREATE TABLE "objetivos" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objetivos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "objetivos_label_key" ON "objetivos"("label");

-- CreateTable
CREATE TABLE "modalidades" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modalidades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "modalidades_label_key" ON "modalidades"("label");

-- Seed the values the fixed enums used to hold, now as editable rows
INSERT INTO "objetivos" ("id", "label") VALUES
    (gen_random_uuid(), 'Hipertrofia'),
    (gen_random_uuid(), 'Fuerza'),
    (gen_random_uuid(), 'Descenso');

INSERT INTO "modalidades" ("id", "label") VALUES
    (gen_random_uuid(), 'Gimnasio'),
    (gen_random_uuid(), 'Casa');

-- AlterTable: add the new FK columns
ALTER TABLE "students" ADD COLUMN "objetivo_id" TEXT;
ALTER TABLE "students" ADD COLUMN "modalidad_id" TEXT;

-- Backfill from the old enum columns before dropping them
UPDATE "students" SET "objetivo_id" = (
    SELECT "id" FROM "objetivos" WHERE "label" = CASE "students"."objetivo"
        WHEN 'hipertrofia' THEN 'Hipertrofia'
        WHEN 'fuerza' THEN 'Fuerza'
        WHEN 'descenso' THEN 'Descenso'
    END
) WHERE "students"."objetivo" IS NOT NULL;

UPDATE "students" SET "modalidad_id" = (
    SELECT "id" FROM "modalidades" WHERE "label" = CASE "students"."modalidad"
        WHEN 'gimnasio' THEN 'Gimnasio'
        WHEN 'casa' THEN 'Casa'
    END
) WHERE "students"."modalidad" IS NOT NULL;

-- DropColumn (old enum-typed columns)
ALTER TABLE "students" DROP COLUMN "objetivo";
ALTER TABLE "students" DROP COLUMN "modalidad";

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_objetivo_id_fkey" FOREIGN KEY ("objetivo_id") REFERENCES "objetivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "students" ADD CONSTRAINT "students_modalidad_id_fkey" FOREIGN KEY ("modalidad_id") REFERENCES "modalidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropEnum
DROP TYPE "Objetivo";
DROP TYPE "Modalidad";
