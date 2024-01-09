/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `FreeDateList` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FreeDateList_title_key" ON "FreeDateList"("title");
