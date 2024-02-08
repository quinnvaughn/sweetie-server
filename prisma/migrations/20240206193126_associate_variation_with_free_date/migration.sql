/*
  Warnings:

  - You are about to drop the column `freeDateId` on the `PlannedDate` table. All the data in the column will be lost.
  - Added the required column `freeDateId` to the `FreeDateVariation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PlannedDate" DROP CONSTRAINT "PlannedDate_freeDateId_fkey";

-- AlterTable
ALTER TABLE "FreeDateVariation" ADD COLUMN "freeDateId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PlannedDate" DROP COLUMN "freeDateId";

-- AddForeignKey
ALTER TABLE "FreeDateVariation" ADD CONSTRAINT "FreeDateVariation_freeDateId_fkey" FOREIGN KEY ("freeDateId") REFERENCES "FreeDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
