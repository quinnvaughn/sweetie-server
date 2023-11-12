/*
  Warnings:

  - You are about to drop the column `authorId` on the `DateExperience` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DateExperience" DROP CONSTRAINT "DateExperience_authorId_fkey";

-- AlterTable
ALTER TABLE "DateExperience" DROP COLUMN "authorId";
