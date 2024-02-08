/*
  Warnings:

  - A unique constraint covering the columns `[originId,destinationId]` on the table `Travel` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Travel_originId_destinationId_key" ON "Travel"("originId", "destinationId");
