/*
  Warnings:

  - You are about to drop the column `date` on the `GroupDate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GroupDate" DROP COLUMN "date",
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
