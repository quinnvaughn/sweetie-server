ALTER TABLE "DateIdea" RENAME CONSTRAINT "DateIdea_authorId_fkey" TO "DateExperience_authorId_fkey";

ALTER TABLE "DateStop" RENAME CONSTRAINT "DateStop_ideaId_fkey" TO "DateStop_experienceId_fkey";

ALTER TABLE "PlannedDate" RENAME CONSTRAINT "PlannedDate_dateIdeaId_fkey" TO "PlannedDate_dateExperienceId_fkey";

-- AlterTable
ALTER TABLE "DateStop" RENAME COLUMN "ideaId" TO "experienceId";

-- AlterTable
ALTER TABLE "PlannedDate" RENAME COLUMN "dateIdeaId" TO "dateExperienceId";

ALTER TABLE "DateIdea" RENAME TO "DateExperience";
