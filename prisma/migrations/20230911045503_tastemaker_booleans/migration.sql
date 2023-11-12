-- AlterTable
ALTER TABLE "Tastemaker" ADD COLUMN     "isPartiallySetup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSetup" BOOLEAN NOT NULL DEFAULT false;
