/*
  Warnings:

  - You are about to drop the `_GroupDateWaitlistGroupToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `creatorId` to the `GroupDateWaitlistGroup` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_GroupDateWaitlistGroupToUser" DROP CONSTRAINT "_GroupDateWaitlistGroupToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_GroupDateWaitlistGroupToUser" DROP CONSTRAINT "_GroupDateWaitlistGroupToUser_B_fkey";

-- AlterTable
ALTER TABLE "GroupDateWaitlistGroup" ADD COLUMN     "creatorId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_GroupDateWaitlistGroupToUser";

-- CreateTable
CREATE TABLE "_GroupDateWaitlistGroupUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_GroupDateWaitlistGroupUser_AB_unique" ON "_GroupDateWaitlistGroupUser"("A", "B");

-- CreateIndex
CREATE INDEX "_GroupDateWaitlistGroupUser_B_index" ON "_GroupDateWaitlistGroupUser"("B");

-- AddForeignKey
ALTER TABLE "GroupDateWaitlistGroup" ADD CONSTRAINT "GroupDateWaitlistGroup_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupDateWaitlistGroupUser" ADD CONSTRAINT "_GroupDateWaitlistGroupUser_A_fkey" FOREIGN KEY ("A") REFERENCES "GroupDateWaitlistGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupDateWaitlistGroupUser" ADD CONSTRAINT "_GroupDateWaitlistGroupUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
