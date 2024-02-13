/*
  Warnings:

  - You are about to drop the `DateStopDraft` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DateStopDraft" DROP CONSTRAINT "DateStopDraft_freeDateId_fkey";

-- DropForeignKey
ALTER TABLE "DateStopDraft" DROP CONSTRAINT "DateStopDraft_locationId_fkey";

-- DropTable
DROP TABLE "DateStopDraft";

-- CreateTable
CREATE TABLE "OrderedDateStopDraft" (
    "order" INTEGER NOT NULL DEFAULT 1,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "estimatedTime" INTEGER NOT NULL DEFAULT 60,
    "freeDateId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrderedDateStopDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateStopOptionDraft" (
    "title" TEXT,
    "content" TEXT,
    "optionOrder" INTEGER NOT NULL,
    "locationId" TEXT,
    "orderedDateStopId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,
    "zenstack_transaction" TEXT,

    CONSTRAINT "DateStopOptionDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DateStopOptionDraft_zenstack_transaction_idx" ON "DateStopOptionDraft"("zenstack_transaction");

-- AddForeignKey
ALTER TABLE "OrderedDateStopDraft" ADD CONSTRAINT "OrderedDateStopDraft_freeDateId_fkey" FOREIGN KEY ("freeDateId") REFERENCES "FreeDateDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateStopOptionDraft" ADD CONSTRAINT "DateStopOptionDraft_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateStopOptionDraft" ADD CONSTRAINT "DateStopOptionDraft_orderedDateStopId_fkey" FOREIGN KEY ("orderedDateStopId") REFERENCES "OrderedDateStopDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
