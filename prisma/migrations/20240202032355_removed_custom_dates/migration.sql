/*
  Warnings:

  - You are about to drop the `CustomDate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CustomDateMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CustomDateRefund` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CustomDateRefundStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CustomDateStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CustomDateSuggestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CustomDateSuggestionStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CustomDateSuggestionStop` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CustomDateSuggestionStopRequestedChange` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CityToCustomDate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CustomDateToTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CustomDate" DROP CONSTRAINT "CustomDate_requestorId_fkey";

-- DropForeignKey
ALTER TABLE "CustomDate" DROP CONSTRAINT "CustomDate_statusId_fkey";

-- DropForeignKey
ALTER TABLE "CustomDate" DROP CONSTRAINT "CustomDate_tastemakerId_fkey";

-- DropForeignKey
ALTER TABLE "CustomDateMessage" DROP CONSTRAINT "CustomDateMessage_customDateId_fkey";

-- DropForeignKey
ALTER TABLE "CustomDateMessage" DROP CONSTRAINT "CustomDateMessage_senderId_fkey";

-- DropForeignKey
ALTER TABLE "CustomDateRefund" DROP CONSTRAINT "CustomDateRefund_customDateId_fkey";

-- DropForeignKey
ALTER TABLE "CustomDateRefund" DROP CONSTRAINT "CustomDateRefund_statusId_fkey";

-- DropForeignKey
ALTER TABLE "CustomDateSuggestion" DROP CONSTRAINT "CustomDateSuggestion_customDateId_fkey";

-- DropForeignKey
ALTER TABLE "CustomDateSuggestion" DROP CONSTRAINT "CustomDateSuggestion_statusId_fkey";

-- DropForeignKey
ALTER TABLE "CustomDateSuggestionStop" DROP CONSTRAINT "CustomDateSuggestionStop_locationId_fkey";

-- DropForeignKey
ALTER TABLE "CustomDateSuggestionStop" DROP CONSTRAINT "CustomDateSuggestionStop_suggestionId_fkey";

-- DropForeignKey
ALTER TABLE "CustomDateSuggestionStopRequestedChange" DROP CONSTRAINT "CustomDateSuggestionStopRequestedChange_stopId_fkey";

-- DropForeignKey
ALTER TABLE "FreeDateDraft" DROP CONSTRAINT "FreeDateDraft_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Tastemaker" DROP CONSTRAINT "Tastemaker_userId_fkey";

-- DropForeignKey
ALTER TABLE "_CityToCustomDate" DROP CONSTRAINT "_CityToCustomDate_A_fkey";

-- DropForeignKey
ALTER TABLE "_CityToCustomDate" DROP CONSTRAINT "_CityToCustomDate_B_fkey";

-- DropForeignKey
ALTER TABLE "_CustomDateToTag" DROP CONSTRAINT "_CustomDateToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_CustomDateToTag" DROP CONSTRAINT "_CustomDateToTag_B_fkey";

-- DropTable
DROP TABLE "CustomDate";

-- DropTable
DROP TABLE "CustomDateMessage";

-- DropTable
DROP TABLE "CustomDateRefund";

-- DropTable
DROP TABLE "CustomDateRefundStatus";

-- DropTable
DROP TABLE "CustomDateStatus";

-- DropTable
DROP TABLE "CustomDateSuggestion";

-- DropTable
DROP TABLE "CustomDateSuggestionStatus";

-- DropTable
DROP TABLE "CustomDateSuggestionStop";

-- DropTable
DROP TABLE "CustomDateSuggestionStopRequestedChange";

-- DropTable
DROP TABLE "_CityToCustomDate";

-- DropTable
DROP TABLE "_CustomDateToTag";

-- AddForeignKey
ALTER TABLE "FreeDateDraft" ADD CONSTRAINT "FreeDateDraft_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tastemaker" ADD CONSTRAINT "Tastemaker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
