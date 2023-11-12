/*
  Warnings:

  - Made the column `minNumStops` on table `Tastemaker` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Tastemaker" ALTER COLUMN "minNumStops" SET NOT NULL,
ALTER COLUMN "minNumStops" SET DEFAULT 1;
