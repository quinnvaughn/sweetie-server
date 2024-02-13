-- DropForeignKey
ALTER TABLE "DateStopOption" DROP CONSTRAINT "DateStopOption_orderedDateStopId_fkey";

-- AddForeignKey
ALTER TABLE "DateStopOption" ADD CONSTRAINT "DateStopOption_orderedDateStopId_fkey" FOREIGN KEY ("orderedDateStopId") REFERENCES "OrderedDateStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
