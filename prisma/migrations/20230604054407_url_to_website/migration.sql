/*
  Warnings:

  - You are about to drop the column `url` on the `Location` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Location" RENAME COLUMN "url" TO "website";
