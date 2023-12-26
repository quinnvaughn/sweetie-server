-- RenameIndex
ALTER INDEX "Travel_fromId_key" RENAME TO "Travel_originId_key";

-- RenameIndex
ALTER INDEX "Travel_toId_key" RENAME TO "Travel_destinationId_key";

-- AlterTable
ALTER TABLE "Travel" RENAME COLUMN "fromId" TO "originId";
-- AlterTable
ALTER TABLE "Travel" RENAME COLUMN "toId" TO "destinationId";

-- RenameForeignKey
ALTER TABLE "Travel" RENAME CONSTRAINT "Travel_fromId_fkey" TO "Travel_originId_fkey";

-- RenameForeignKey
ALTER TABLE "Travel" RENAME CONSTRAINT "Travel_toId_fkey" TO "Travel_destinationId_fkey";