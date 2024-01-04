-- AlterTable
ALTER TABLE "DateStop" ADD COLUMN     "estimatedTime" INTEGER NOT NULL DEFAULT 60;

-- AlterTable
ALTER TABLE "DateStopDraft" ADD COLUMN     "estimatedTime" INTEGER NOT NULL DEFAULT 60;
