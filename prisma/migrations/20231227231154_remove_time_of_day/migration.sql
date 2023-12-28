/*
  Warnings:

  - You are about to drop the `TimeOfDay` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FreeDateDraftToTimeOfDay` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FreeDateToTimeOfDay` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_FreeDateDraftToTimeOfDay" DROP CONSTRAINT "_FreeDateDraftToTimeOfDay_A_fkey";

-- DropForeignKey
ALTER TABLE "_FreeDateDraftToTimeOfDay" DROP CONSTRAINT "_FreeDateDraftToTimeOfDay_B_fkey";

-- DropForeignKey
ALTER TABLE "_FreeDateToTimeOfDay" DROP CONSTRAINT "_FreeDateToTimeOfDay_A_fkey";

-- DropForeignKey
ALTER TABLE "_FreeDateToTimeOfDay" DROP CONSTRAINT "_FreeDateToTimeOfDay_B_fkey";

-- DropTable
DROP TABLE "TimeOfDay";

-- DropTable
DROP TABLE "_FreeDateDraftToTimeOfDay";

-- DropTable
DROP TABLE "_FreeDateToTimeOfDay";
