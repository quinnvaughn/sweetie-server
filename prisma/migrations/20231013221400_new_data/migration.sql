/*
  Warnings:

  - You are about to drop the column `responsedAt` on the `CustomDate` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CustomDate" DROP CONSTRAINT "CustomDate_requestorId_fkey";

-- DropForeignKey
ALTER TABLE "CustomDate" DROP CONSTRAINT "CustomDate_statusId_fkey";

-- DropForeignKey
ALTER TABLE "CustomDate" DROP CONSTRAINT "CustomDate_tastemakerId_fkey";

-- AlterTable
ALTER TABLE "CustomDate" DROP COLUMN "responsedAt",
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastMessageSentAt" TIMESTAMP(3),
ADD COLUMN     "respondedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateTable
CREATE TABLE "CustomDateRefund" (
    "statusId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "customDateId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CustomDateRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomDateRefundStatus" (
    "name" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CustomDateRefundStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomDateSuggestion" (
    "customDateId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "statusId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CustomDateSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomDateSuggestionStatus" (
    "name" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CustomDateSuggestionStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomDateSuggestionStop" (
    "order" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CustomDateSuggestionStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomDateSuggestionStopRequestedChange" (
    "stopId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CustomDateSuggestionStopRequestedChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomDateMessage" (
    "customDateId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CustomDateMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomDateRefund_customDateId_key" ON "CustomDateRefund"("customDateId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomDateRefundStatus_name_key" ON "CustomDateRefundStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomDateSuggestionStatus_name_key" ON "CustomDateSuggestionStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomDateSuggestionStopRequestedChange_stopId_key" ON "CustomDateSuggestionStopRequestedChange"("stopId");

-- AddForeignKey
ALTER TABLE "CustomDate" ADD CONSTRAINT "CustomDate_tastemakerId_fkey" FOREIGN KEY ("tastemakerId") REFERENCES "Tastemaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDate" ADD CONSTRAINT "CustomDate_requestorId_fkey" FOREIGN KEY ("requestorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDate" ADD CONSTRAINT "CustomDate_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "CustomDateStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDateRefund" ADD CONSTRAINT "CustomDateRefund_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "CustomDateRefundStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDateRefund" ADD CONSTRAINT "CustomDateRefund_customDateId_fkey" FOREIGN KEY ("customDateId") REFERENCES "CustomDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDateSuggestion" ADD CONSTRAINT "CustomDateSuggestion_customDateId_fkey" FOREIGN KEY ("customDateId") REFERENCES "CustomDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDateSuggestion" ADD CONSTRAINT "CustomDateSuggestion_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "CustomDateSuggestionStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDateSuggestionStop" ADD CONSTRAINT "CustomDateSuggestionStop_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDateSuggestionStop" ADD CONSTRAINT "CustomDateSuggestionStop_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "CustomDateSuggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDateSuggestionStopRequestedChange" ADD CONSTRAINT "CustomDateSuggestionStopRequestedChange_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "CustomDateSuggestionStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDateMessage" ADD CONSTRAINT "CustomDateMessage_customDateId_fkey" FOREIGN KEY ("customDateId") REFERENCES "CustomDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDateMessage" ADD CONSTRAINT "CustomDateMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
