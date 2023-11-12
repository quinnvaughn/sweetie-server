ALTER TABLE "PlannedDate" RENAME CONSTRAINT "PlannedDate_dateExperienceId_fkey" TO "PlannedDate_experienceId_fkey";

ALTER TABLE "PlannedDate" RENAME COLUMN "dateExperienceId" TO "experienceId";