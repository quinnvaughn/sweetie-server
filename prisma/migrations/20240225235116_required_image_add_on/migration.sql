/*
  Warnings:

  - Made the column `image` on table `EventAddOn` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "EventAddOn" ALTER COLUMN "image" SET NOT NULL;
