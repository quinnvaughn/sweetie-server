/*
  Warnings:

  - You are about to drop the column `deleted` on the `DateExperience` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DateExperience" DROP COLUMN "deleted",
ADD COLUMN     "retired" BOOLEAN NOT NULL DEFAULT false;
