-- DropForeignKey
ALTER TABLE "DateExperience" RENAME CONSTRAINT "DateExperience_tastemakerId_fkey" TO "FreeDate_tastemakerId_fkey";

-- DropForeignKey
ALTER TABLE "DateExperienceDraft" RENAME CONSTRAINT "DateExperienceDraft_authorId_fkey" TO "FreeDateDraft_authorId_fkey";

-- DropForeignKey
ALTER TABLE "DateExperienceViews" RENAME CONSTRAINT "DateExperienceViews_experienceId_fkey" TO "FreeDateViews_freeDateId_fkey";

-- DropForeignKey
ALTER TABLE "DateStop" RENAME CONSTRAINT "DateStop_experienceId_fkey" TO "DateStop_freeDateId_fkey";

-- DropForeignKey
ALTER TABLE "DateStopDraft" RENAME CONSTRAINT "DateStopDraft_experienceId_fkey" TO "DateStopDraft_freeDateId_fkey";

-- DropForeignKey
ALTER TABLE "PlannedDate" RENAME CONSTRAINT "PlannedDate_experienceId_fkey" TO "PlannedDate_freeDateId_fkey";

-- DropForeignKey
ALTER TABLE "_DateExperienceDraftToTag" RENAME CONSTRAINT "_DateExperienceDraftToTag_A_fkey" TO "_FreeDateDraftToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_DateExperienceDraftToTag" RENAME CONSTRAINT "_DateExperienceDraftToTag_B_fkey" TO "_FreeDateDraftToTag_B_fkey";

-- DropForeignKey
ALTER TABLE "_DateExperienceDraftToTimeOfDay" RENAME CONSTRAINT "_DateExperienceDraftToTimeOfDay_A_fkey" TO "_FreeDateDraftToTimeOfDay_A_fkey";

-- DropForeignKey
ALTER TABLE "_DateExperienceDraftToTimeOfDay" RENAME CONSTRAINT "_DateExperienceDraftToTimeOfDay_B_fkey" TO "_FreeDateDraftToTimeOfDay_B_fkey";

-- DropForeignKey
ALTER TABLE "_DateExperienceToTag" RENAME CONSTRAINT "_DateExperienceToTag_A_fkey" TO "_FreeDateToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_DateExperienceToTag" RENAME CONSTRAINT "_DateExperienceToTag_B_fkey" TO "_FreeDateToTag_B_fkey";

-- DropForeignKey
ALTER TABLE "_DateExperienceToTimeOfDay" RENAME CONSTRAINT "_DateExperienceToTimeOfDay_A_fkey" TO "_FreeDateToTimeOfDay_A_fkey";

-- DropForeignKey
ALTER TABLE "_DateExperienceToTimeOfDay" RENAME CONSTRAINT "_DateExperienceToTimeOfDay_B_fkey" TO "_FreeDateToTimeOfDay_B_fkey";

-- AlterTable
ALTER TABLE "DateStop" RENAME COLUMN "experienceId" TO "freeDateId";

-- AlterTable
ALTER TABLE "DateStopDraft" RENAME COLUMN "experienceId" TO "freeDateId";
-- AlterTable
ALTER TABLE "PlannedDate" RENAME COLUMN "experienceId" TO "freeDateId";

-- Alter Table
ALTER TABLE "DateExperience" RENAME TO "FreeDate";


-- Alter Table
ALTER TABLE "DateExperienceDraft" RENAME TO "FreeDateDraft";

-- Alter Table
ALTER TABLE "DateExperienceViews" RENAME TO "FreeDateViews";

ALTER TABLE "FreeDateViews" RENAME COLUMN "experienceId" TO "freeDateId";

-- Alter Table
ALTER TABLE "_DateExperienceDraftToTag" RENAME TO "_FreeDateDraftToTag";

-- Alter Table
ALTER TABLE "_DateExperienceDraftToTimeOfDay" RENAME TO "_FreeDateDraftToTimeOfDay";

-- Alter Table
ALTER TABLE "_DateExperienceToTag" RENAME TO "_FreeDateToTag";

-- Alter Table
ALTER TABLE "_DateExperienceToTimeOfDay" RENAME TO "_FreeDateToTimeOfDay";


-- CreateIndex
ALTER INDEX "DateExperience_zenstack_transaction_idx" RENAME TO "FreeDate_zenstack_transaction_idx";

-- CreateIndex
ALTER INDEX "DateExperience_createdAt_idx" RENAME TO "FreeDate_createdAt_idx";

-- CreateIndex
ALTER INDEX "DateExperienceDraft_zenstack_transaction_idx" RENAME TO "FreeDateDraft_zenstack_transaction_idx";

ALTER INDEX "DateExperienceDraft_createdAt_idx" RENAME TO "FreeDateDraft_createdAt_idx";

ALTER INDEX "_DateExperienceToTimeOfDay_AB_unique" RENAME TO "_FreeDateToTimeOfDay_AB_unique";

ALTER INDEX "_DateExperienceToTimeOfDay_B_index" RENAME TO "_FreeDateToTimeOfDay_B_index";

ALTER INDEX "_DateExperienceToTag_AB_unique" RENAME TO "_FreeDateToTag_AB_unique";

ALTER INDEX "_DateExperienceToTag_B_index" RENAME TO "_FreeDateToTag_B_index";

ALTER INDEX "_DateExperienceDraftToTimeOfDay_AB_unique" RENAME TO "_FreeDateDraftToTimeOfDay_AB_unique";

ALTER INDEX "_DateExperienceDraftToTimeOfDay_B_index" RENAME TO "_FreeDateDraftToTimeOfDay_B_index";

ALTER INDEX "_DateExperienceDraftToTag_AB_unique" RENAME TO "_FreeDateDraftToTag_AB_unique";

ALTER INDEX "_DateExperienceDraftToTag_B_index" RENAME TO "_FreeDateDraftToTag_B_index";