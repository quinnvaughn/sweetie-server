/*
  Warnings:

  - You are about to drop the `Waitlist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Whitelist` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Waitlist" DROP CONSTRAINT "Waitlist_cityId_fkey";

-- DropTable
DROP TABLE "Waitlist";

-- DropTable
DROP TABLE "Whitelist";
