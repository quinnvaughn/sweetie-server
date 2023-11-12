/*
  Warnings:

  - You are about to drop the column `experienceId` on the `TimeOfDay` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "TimeOfDay" DROP CONSTRAINT "TimeOfDay_experienceId_fkey";

-- AlterTable
ALTER TABLE "TimeOfDay" DROP COLUMN "experienceId";

-- CreateTable
CREATE TABLE "_DateExperienceToTimeOfDay" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DateExperienceToTimeOfDay_AB_unique" ON "_DateExperienceToTimeOfDay"("A", "B");

-- CreateIndex
CREATE INDEX "_DateExperienceToTimeOfDay_B_index" ON "_DateExperienceToTimeOfDay"("B");

-- AddForeignKey
ALTER TABLE "_DateExperienceToTimeOfDay" ADD CONSTRAINT "_DateExperienceToTimeOfDay_A_fkey" FOREIGN KEY ("A") REFERENCES "DateExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DateExperienceToTimeOfDay" ADD CONSTRAINT "_DateExperienceToTimeOfDay_B_fkey" FOREIGN KEY ("B") REFERENCES "TimeOfDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
