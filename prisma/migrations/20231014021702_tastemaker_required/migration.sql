/*
  Warnings:

  - Made the column `tastemakerId` on table `DateExperience` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "DateExperience" DROP CONSTRAINT "DateExperience_tastemakerId_fkey";

-- AlterTable
ALTER TABLE "DateExperience" ALTER COLUMN "tastemakerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "DateExperience" ADD CONSTRAINT "DateExperience_tastemakerId_fkey" FOREIGN KEY ("tastemakerId") REFERENCES "Tastemaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
