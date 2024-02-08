/*
  Warnings:

  - You are about to drop the `_DateStopToFreeDateVariation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_DateStopToFreeDateVariation" DROP CONSTRAINT "_DateStopToFreeDateVariation_A_fkey";

-- DropForeignKey
ALTER TABLE "_DateStopToFreeDateVariation" DROP CONSTRAINT "_DateStopToFreeDateVariation_B_fkey";

-- DropTable
DROP TABLE "_DateStopToFreeDateVariation";

-- CreateTable
CREATE TABLE "OrderedDateStop" (
    "order" INTEGER NOT NULL DEFAULT 1,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "estimatedTime" INTEGER NOT NULL DEFAULT 60,
    "freeDateId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrderedDateStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateStopOption" (
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "optionOrder" INTEGER NOT NULL DEFAULT 1,
    "orderedDateStopId" TEXT NOT NULL,
    "freeDateVariationId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,
    "zenstack_transaction" TEXT,

    CONSTRAINT "DateStopOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DateStopOption_zenstack_transaction_idx" ON "DateStopOption"("zenstack_transaction");

-- AddForeignKey
ALTER TABLE "OrderedDateStop" ADD CONSTRAINT "OrderedDateStop_freeDateId_fkey" FOREIGN KEY ("freeDateId") REFERENCES "FreeDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateStopOption" ADD CONSTRAINT "DateStopOption_orderedDateStopId_fkey" FOREIGN KEY ("orderedDateStopId") REFERENCES "OrderedDateStop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateStopOption" ADD CONSTRAINT "DateStopOption_freeDateVariationId_fkey" FOREIGN KEY ("freeDateVariationId") REFERENCES "FreeDateVariation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateStopOption" ADD CONSTRAINT "DateStopOption_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
