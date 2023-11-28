/*
  Warnings:

  - You are about to drop the column `experienceId` on the `DateStop` table. All the data in the column will be lost.
  - You are about to drop the column `experienceId` on the `DateStopDraft` table. All the data in the column will be lost.
  - You are about to drop the column `experienceId` on the `PlannedDate` table. All the data in the column will be lost.
  - You are about to drop the `DateExperience` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DateExperienceDraft` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DateExperienceViews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DateExperienceDraftToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DateExperienceDraftToTimeOfDay` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DateExperienceToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DateExperienceToTimeOfDay` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `freeDateId` to the `DateStop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `freeDateId` to the `DateStopDraft` table without a default value. This is not possible if the table is not empty.
  - Added the required column `freeDateId` to the `PlannedDate` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DateExperience" DROP CONSTRAINT "DateExperience_tastemakerId_fkey";

-- DropForeignKey
ALTER TABLE "DateExperienceDraft" DROP CONSTRAINT "DateExperienceDraft_authorId_fkey";

-- DropForeignKey
ALTER TABLE "DateExperienceViews" DROP CONSTRAINT "DateExperienceViews_experienceId_fkey";

-- DropForeignKey
ALTER TABLE "DateStop" DROP CONSTRAINT "DateStop_experienceId_fkey";

-- DropForeignKey
ALTER TABLE "DateStopDraft" DROP CONSTRAINT "DateStopDraft_experienceId_fkey";

-- DropForeignKey
ALTER TABLE "PlannedDate" DROP CONSTRAINT "PlannedDate_experienceId_fkey";

-- DropForeignKey
ALTER TABLE "_DateExperienceDraftToTag" DROP CONSTRAINT "_DateExperienceDraftToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_DateExperienceDraftToTag" DROP CONSTRAINT "_DateExperienceDraftToTag_B_fkey";

-- DropForeignKey
ALTER TABLE "_DateExperienceDraftToTimeOfDay" DROP CONSTRAINT "_DateExperienceDraftToTimeOfDay_A_fkey";

-- DropForeignKey
ALTER TABLE "_DateExperienceDraftToTimeOfDay" DROP CONSTRAINT "_DateExperienceDraftToTimeOfDay_B_fkey";

-- DropForeignKey
ALTER TABLE "_DateExperienceToTag" DROP CONSTRAINT "_DateExperienceToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_DateExperienceToTag" DROP CONSTRAINT "_DateExperienceToTag_B_fkey";

-- DropForeignKey
ALTER TABLE "_DateExperienceToTimeOfDay" DROP CONSTRAINT "_DateExperienceToTimeOfDay_A_fkey";

-- DropForeignKey
ALTER TABLE "_DateExperienceToTimeOfDay" DROP CONSTRAINT "_DateExperienceToTimeOfDay_B_fkey";

-- AlterTable
ALTER TABLE "DateStop" RENAME COLUMN "experienceId" TO "freeDateId";

-- AlterTable
ALTER TABLE "DateStopDraft" RENAME COLUMN "experienceId" TO "freeDateId";
-- AlterTable
ALTER TABLE "PlannedDate" RENAME COLUMN "experienceId" TO "freeDateId";

-- DropTable
ALTER TABLE "DateExperience" RENAME TO "FreeDate";


-- DropTable
ALTER TABLE "DateExperienceDraft" RENAME TO "FreeDateDraft";

-- DropTable
ALTER TABLE "DateExperienceViews" RENAME TO "FreeDateViews";

ALTER TABLE "FreeDateViews" RENAME COLUMN "experienceId" TO "freeDateId";

-- DropTable
DROP TABLE "_DateExperienceDraftToTag";

-- DropTable
DROP TABLE "_DateExperienceDraftToTimeOfDay";

-- DropTable
DROP TABLE "_DateExperienceToTag";

-- DropTable
DROP TABLE "_DateExperienceToTimeOfDay";




-- CreateTable
CREATE TABLE "_FreeDateToTimeOfDay" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_FreeDateToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_FreeDateDraftToTimeOfDay" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_FreeDateDraftToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "FreeDate_zenstack_transaction_idx" ON "FreeDate"("zenstack_transaction");

-- CreateIndex
CREATE INDEX "FreeDate_createdAt_idx" ON "FreeDate"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "FreeDateDraft_zenstack_transaction_idx" ON "FreeDateDraft"("zenstack_transaction");

-- CreateIndex
CREATE INDEX "FreeDateDraft_createdAt_idx" ON "FreeDateDraft"("createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FreeDateViews_freeDateId_key" ON "FreeDateViews"("freeDateId");

-- CreateIndex
CREATE UNIQUE INDEX "_FreeDateToTimeOfDay_AB_unique" ON "_FreeDateToTimeOfDay"("A", "B");

-- CreateIndex
CREATE INDEX "_FreeDateToTimeOfDay_B_index" ON "_FreeDateToTimeOfDay"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FreeDateToTag_AB_unique" ON "_FreeDateToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_FreeDateToTag_B_index" ON "_FreeDateToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FreeDateDraftToTimeOfDay_AB_unique" ON "_FreeDateDraftToTimeOfDay"("A", "B");

-- CreateIndex
CREATE INDEX "_FreeDateDraftToTimeOfDay_B_index" ON "_FreeDateDraftToTimeOfDay"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FreeDateDraftToTag_AB_unique" ON "_FreeDateDraftToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_FreeDateDraftToTag_B_index" ON "_FreeDateDraftToTag"("B");

-- AddForeignKey
ALTER TABLE "FreeDate" ADD CONSTRAINT "FreeDate_tastemakerId_fkey" FOREIGN KEY ("tastemakerId") REFERENCES "Tastemaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateStop" ADD CONSTRAINT "DateStop_freeDateId_fkey" FOREIGN KEY ("freeDateId") REFERENCES "FreeDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedDate" ADD CONSTRAINT "PlannedDate_freeDateId_fkey" FOREIGN KEY ("freeDateId") REFERENCES "FreeDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreeDateDraft" ADD CONSTRAINT "FreeDateDraft_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateStopDraft" ADD CONSTRAINT "DateStopDraft_freeDateId_fkey" FOREIGN KEY ("freeDateId") REFERENCES "FreeDateDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreeDateViews" ADD CONSTRAINT "FreeDateViews_freeDateId_fkey" FOREIGN KEY ("freeDateId") REFERENCES "FreeDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreeDateToTimeOfDay" ADD CONSTRAINT "_FreeDateToTimeOfDay_A_fkey" FOREIGN KEY ("A") REFERENCES "FreeDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreeDateToTimeOfDay" ADD CONSTRAINT "_FreeDateToTimeOfDay_B_fkey" FOREIGN KEY ("B") REFERENCES "TimeOfDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreeDateToTag" ADD CONSTRAINT "_FreeDateToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "FreeDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreeDateToTag" ADD CONSTRAINT "_FreeDateToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreeDateDraftToTimeOfDay" ADD CONSTRAINT "_FreeDateDraftToTimeOfDay_A_fkey" FOREIGN KEY ("A") REFERENCES "FreeDateDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreeDateDraftToTimeOfDay" ADD CONSTRAINT "_FreeDateDraftToTimeOfDay_B_fkey" FOREIGN KEY ("B") REFERENCES "TimeOfDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreeDateDraftToTag" ADD CONSTRAINT "_FreeDateDraftToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "FreeDateDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreeDateDraftToTag" ADD CONSTRAINT "_FreeDateDraftToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
