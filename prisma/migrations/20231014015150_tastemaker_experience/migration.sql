-- AlterTable
ALTER TABLE "DateExperience" ADD COLUMN     "tastemakerId" TEXT;

-- AddForeignKey
ALTER TABLE "DateExperience" ADD CONSTRAINT "DateExperience_tastemakerId_fkey" FOREIGN KEY ("tastemakerId") REFERENCES "Tastemaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
