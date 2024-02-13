-- DropForeignKey
ALTER TABLE "OrderedDateStopDraft" DROP CONSTRAINT "OrderedDateStopDraft_freeDateId_fkey";

-- AddForeignKey
ALTER TABLE "OrderedDateStopDraft" ADD CONSTRAINT "OrderedDateStopDraft_freeDateId_fkey" FOREIGN KEY ("freeDateId") REFERENCES "FreeDateDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
