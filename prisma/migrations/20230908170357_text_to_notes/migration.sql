/*
  Warnings:

  - You are about to drop the column `text` on the `CustomDate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CustomDate" RENAME COLUMN "text" TO "notes"; 
