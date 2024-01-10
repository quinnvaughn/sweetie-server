/*
  Warnings:

  - You are about to drop the `_FreeDateToCategorizedDateList` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_FreeDateToFreeDateList" DROP CONSTRAINT "_FreeDateToFreeDateList_A_fkey";

-- DropForeignKey
ALTER TABLE "_FreeDateToFreeDateList" DROP CONSTRAINT "_FreeDateToFreeDateList_B_fkey";

-- AlterTable
ALTER TABLE "CategorizedDateList" RENAME CONSTRAINT "FreeDateList_pkey" TO "CategorizedDateList_pkey";
ALTER TABLE "CategorizedDateList" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "_FreeDateToFreeDateList";

-- CreateTable
CREATE TABLE "_CategorizedDateListToFreeDate" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CategorizedDateListToFreeDate_AB_unique" ON "_CategorizedDateListToFreeDate"("A", "B");

-- CreateIndex
CREATE INDEX "_CategorizedDateListToFreeDate_B_index" ON "_CategorizedDateListToFreeDate"("B");

-- AddForeignKey
ALTER TABLE "_CategorizedDateListToFreeDate" ADD CONSTRAINT "_CategorizedDateListToFreeDate_A_fkey" FOREIGN KEY ("A") REFERENCES "CategorizedDateList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategorizedDateListToFreeDate" ADD CONSTRAINT "_CategorizedDateListToFreeDate_B_fkey" FOREIGN KEY ("B") REFERENCES "FreeDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "FreeDateList_title_key" RENAME TO "CategorizedDateList_title_key";
