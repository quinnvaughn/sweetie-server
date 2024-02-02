-- DropForeignKey
ALTER TABLE "FreeDate" DROP CONSTRAINT "FreeDate_tastemakerId_fkey";

-- AddForeignKey
ALTER TABLE "FreeDate" ADD CONSTRAINT "FreeDate_tastemakerId_fkey" FOREIGN KEY ("tastemakerId") REFERENCES "Tastemaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
