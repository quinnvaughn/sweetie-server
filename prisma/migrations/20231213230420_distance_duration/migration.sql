/*
  Warnings:

  - You are about to drop the column `distance` on the `Travel` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Travel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Travel" DROP COLUMN "distance",
DROP COLUMN "duration";

-- CreateTable
CREATE TABLE "Distance" (
    "value" INTEGER NOT NULL,
    "travelId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Distance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Duration" (
    "value" INTEGER NOT NULL,
    "travelId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Duration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Distance_travelId_key" ON "Distance"("travelId");

-- CreateIndex
CREATE UNIQUE INDEX "Duration_travelId_key" ON "Duration"("travelId");

-- AddForeignKey
ALTER TABLE "Distance" ADD CONSTRAINT "Distance_travelId_fkey" FOREIGN KEY ("travelId") REFERENCES "Travel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duration" ADD CONSTRAINT "Duration_travelId_fkey" FOREIGN KEY ("travelId") REFERENCES "Travel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
