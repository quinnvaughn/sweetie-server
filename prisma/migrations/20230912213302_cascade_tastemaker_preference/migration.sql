-- DropForeignKey
ALTER TABLE "TastemakerPreference" DROP CONSTRAINT "TastemakerPreference_doesNotDoId_fkey";

-- DropForeignKey
ALTER TABLE "TastemakerPreference" DROP CONSTRAINT "TastemakerPreference_specializesInId_fkey";

-- AddForeignKey
ALTER TABLE "TastemakerPreference" ADD CONSTRAINT "TastemakerPreference_specializesInId_fkey" FOREIGN KEY ("specializesInId") REFERENCES "Tastemaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TastemakerPreference" ADD CONSTRAINT "TastemakerPreference_doesNotDoId_fkey" FOREIGN KEY ("doesNotDoId") REFERENCES "Tastemaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
