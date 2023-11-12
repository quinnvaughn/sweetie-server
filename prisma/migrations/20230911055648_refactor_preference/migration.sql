/*
  Warnings:

  - You are about to drop the column `cityId` on the `TastemakerPreference` table. All the data in the column will be lost.
  - You are about to drop the column `tagId` on the `TastemakerPreference` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[specializesInId]` on the table `TastemakerPreference` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[doesNotDoId]` on the table `TastemakerPreference` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "TastemakerPreference" DROP CONSTRAINT "TastemakerPreference_cityId_fkey";

-- DropForeignKey
ALTER TABLE "TastemakerPreference" DROP CONSTRAINT "TastemakerPreference_tagId_fkey";

-- AlterTable
ALTER TABLE "TastemakerPreference" DROP COLUMN "cityId",
DROP COLUMN "tagId";

-- CreateTable
CREATE TABLE "_CityToTastemakerPreference" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_TagToTastemakerPreference" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CityToTastemakerPreference_AB_unique" ON "_CityToTastemakerPreference"("A", "B");

-- CreateIndex
CREATE INDEX "_CityToTastemakerPreference_B_index" ON "_CityToTastemakerPreference"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TagToTastemakerPreference_AB_unique" ON "_TagToTastemakerPreference"("A", "B");

-- CreateIndex
CREATE INDEX "_TagToTastemakerPreference_B_index" ON "_TagToTastemakerPreference"("B");

-- CreateIndex
CREATE UNIQUE INDEX "TastemakerPreference_specializesInId_key" ON "TastemakerPreference"("specializesInId");

-- CreateIndex
CREATE UNIQUE INDEX "TastemakerPreference_doesNotDoId_key" ON "TastemakerPreference"("doesNotDoId");

-- AddForeignKey
ALTER TABLE "_CityToTastemakerPreference" ADD CONSTRAINT "_CityToTastemakerPreference_A_fkey" FOREIGN KEY ("A") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CityToTastemakerPreference" ADD CONSTRAINT "_CityToTastemakerPreference_B_fkey" FOREIGN KEY ("B") REFERENCES "TastemakerPreference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToTastemakerPreference" ADD CONSTRAINT "_TagToTastemakerPreference_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToTastemakerPreference" ADD CONSTRAINT "_TagToTastemakerPreference_B_fkey" FOREIGN KEY ("B") REFERENCES "TastemakerPreference"("id") ON DELETE CASCADE ON UPDATE CASCADE;
