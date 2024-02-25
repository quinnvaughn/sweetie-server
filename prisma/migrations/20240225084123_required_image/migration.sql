/*
  Warnings:

  - Made the column `image` on table `EventProduct` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "EventProduct" ALTER COLUMN "image" SET NOT NULL;
