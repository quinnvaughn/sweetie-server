-- AlterTable
ALTER TABLE "FreeDate" RENAME CONSTRAINT "DateExperience_pkey" TO "FreeDate_pkey";

-- AlterTable
ALTER TABLE "FreeDateDraft" RENAME CONSTRAINT "DateExperienceDraft_pkey" TO "FreeDateDraft_pkey";

-- AlterTable
ALTER TABLE "FreeDateViews" RENAME CONSTRAINT "DateExperienceViews_pkey" TO "FreeDateViews_pkey";

-- RenameIndex
ALTER INDEX "DateExperienceViews_experienceId_key" RENAME TO "FreeDateViews_freeDateId_key";
