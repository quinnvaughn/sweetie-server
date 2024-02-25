/*
  Warnings:

  - Added the required column `position` to the `EventWaitlistGroup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EventWaitlistGroup" ADD COLUMN     "position" INTEGER NOT NULL;
