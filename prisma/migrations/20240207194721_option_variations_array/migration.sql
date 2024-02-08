/*
  Warnings:

  - You are about to drop the column `freeDateVariationId` on the `DateStopOption` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DateStopOption" DROP CONSTRAINT "DateStopOption_freeDateVariationId_fkey";

-- AlterTable
ALTER TABLE "DateStopOption" DROP COLUMN "freeDateVariationId";

-- CreateTable
CREATE TABLE "_DateStopOptionToFreeDateVariation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DateStopOptionToFreeDateVariation_AB_unique" ON "_DateStopOptionToFreeDateVariation"("A", "B");

-- CreateIndex
CREATE INDEX "_DateStopOptionToFreeDateVariation_B_index" ON "_DateStopOptionToFreeDateVariation"("B");

-- AddForeignKey
ALTER TABLE "_DateStopOptionToFreeDateVariation" ADD CONSTRAINT "_DateStopOptionToFreeDateVariation_A_fkey" FOREIGN KEY ("A") REFERENCES "DateStopOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DateStopOptionToFreeDateVariation" ADD CONSTRAINT "_DateStopOptionToFreeDateVariation_B_fkey" FOREIGN KEY ("B") REFERENCES "FreeDateVariation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
