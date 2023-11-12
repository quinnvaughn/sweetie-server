-- AlterTable
ALTER TABLE "DateExperience" RENAME CONSTRAINT "DateIdea_pkey" TO "DateExperience_pkey";

-- RenameIndex
ALTER INDEX "DateIdea_createdAt_idx" RENAME TO "DateExperience_createdAt_idx";

-- RenameIndex
ALTER INDEX "DateIdea_zenstack_transaction_idx" RENAME TO "DateExperience_zenstack_transaction_idx";
