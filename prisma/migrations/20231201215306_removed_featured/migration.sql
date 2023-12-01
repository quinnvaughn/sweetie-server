/*
  Warnings:

  - You are about to drop the column `featured` on the `FreeDate` table. All the data in the column will be lost.
  - You are about to drop the column `featuredAt` on the `FreeDate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FreeDate" DROP COLUMN "featured",
DROP COLUMN "featuredAt";
