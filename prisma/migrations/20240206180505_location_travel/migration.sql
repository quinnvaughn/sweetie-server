-- DropForeignKey
ALTER TABLE "Travel" DROP CONSTRAINT "Travel_destinationId_fkey";

-- DropForeignKey
ALTER TABLE "Travel" DROP CONSTRAINT "Travel_originId_fkey";

-- DropIndex
DROP INDEX "Travel_destinationId_key";

-- DropIndex
DROP INDEX "Travel_originId_key";

-- AlterTable
ALTER TABLE "DateStop" ADD COLUMN     "optionOrder" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "optional" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PlannedDate" ADD COLUMN     "freeDateVariationId" TEXT;

-- CreateTable
CREATE TABLE "FreeDateVariation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FreeDateVariation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DateStopToFreeDateVariation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DateStopToFreeDateVariation_AB_unique" ON "_DateStopToFreeDateVariation"("A", "B");

-- CreateIndex
CREATE INDEX "_DateStopToFreeDateVariation_B_index" ON "_DateStopToFreeDateVariation"("B");

-- AddForeignKey
ALTER TABLE "Travel" ADD CONSTRAINT "Travel_originId_fkey" FOREIGN KEY ("originId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Travel" ADD CONSTRAINT "Travel_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedDate" ADD CONSTRAINT "PlannedDate_freeDateVariationId_fkey" FOREIGN KEY ("freeDateVariationId") REFERENCES "FreeDateVariation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DateStopToFreeDateVariation" ADD CONSTRAINT "_DateStopToFreeDateVariation_A_fkey" FOREIGN KEY ("A") REFERENCES "DateStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DateStopToFreeDateVariation" ADD CONSTRAINT "_DateStopToFreeDateVariation_B_fkey" FOREIGN KEY ("B") REFERENCES "FreeDateVariation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
