/*
  Warnings:

  - You are about to drop the `DateStop` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DateStop" DROP CONSTRAINT "DateStop_freeDateId_fkey";

-- DropForeignKey
ALTER TABLE "DateStop" DROP CONSTRAINT "DateStop_locationId_fkey";

-- DropTable
DROP TABLE "DateStop";
