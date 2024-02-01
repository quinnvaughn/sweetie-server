/*
  Warnings:

  - Added the required column `icon` to the `Badge` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Badge" ADD COLUMN     "icon" TEXT NOT NULL;
