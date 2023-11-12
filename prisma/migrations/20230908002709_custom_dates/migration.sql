/*
  Warnings:

  - You are about to drop the `DateRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DateRequestStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CityToDateRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DateRequest" DROP CONSTRAINT "DateRequest_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "DateRequest" DROP CONSTRAINT "DateRequest_requestorId_fkey";

-- DropForeignKey
ALTER TABLE "DateRequest" DROP CONSTRAINT "DateRequest_statusId_fkey";

-- DropForeignKey
ALTER TABLE "_CityToDateRequest" DROP CONSTRAINT "_CityToDateRequest_A_fkey";

-- DropForeignKey
ALTER TABLE "_CityToDateRequest" DROP CONSTRAINT "_CityToDateRequest_B_fkey";

-- DropTable
DROP TABLE "DateRequest";

-- DropTable
DROP TABLE "DateRequestStatus";

-- DropTable
DROP TABLE "_CityToDateRequest";

-- CreateTable
CREATE TABLE "CustomDate" (
    "tastemakerId" TEXT NOT NULL,
    "requestorId" TEXT NOT NULL,
    "beginsAt" TIMESTAMP(3) NOT NULL,
    "numStops" INTEGER NOT NULL,
    "priceRangeMin" INTEGER,
    "priceRangeMax" INTEGER,
    "statusId" TEXT NOT NULL,
    "text" TEXT,
    "responsedAt" TIMESTAMP(3),
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CustomDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomDateStatus" (
    "name" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CustomDateStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tastemaker" (
    "price" DOUBLE PRECISION NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Tastemaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CityToCustomDate" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomDateStatus_name_key" ON "CustomDateStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_CityToCustomDate_AB_unique" ON "_CityToCustomDate"("A", "B");

-- CreateIndex
CREATE INDEX "_CityToCustomDate_B_index" ON "_CityToCustomDate"("B");

-- AddForeignKey
ALTER TABLE "CustomDate" ADD CONSTRAINT "CustomDate_tastemakerId_fkey" FOREIGN KEY ("tastemakerId") REFERENCES "Tastemaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDate" ADD CONSTRAINT "CustomDate_requestorId_fkey" FOREIGN KEY ("requestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDate" ADD CONSTRAINT "CustomDate_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "CustomDateStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CityToCustomDate" ADD CONSTRAINT "_CityToCustomDate_A_fkey" FOREIGN KEY ("A") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CityToCustomDate" ADD CONSTRAINT "_CityToCustomDate_B_fkey" FOREIGN KEY ("B") REFERENCES "CustomDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
