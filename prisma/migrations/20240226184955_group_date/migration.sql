/*
  Warnings:

  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventAddOn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventOrderedStop` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventWaitlist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventWaitlistGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EventWaitlistGroupToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_tastemakerId_fkey";

-- DropForeignKey
ALTER TABLE "EventAddOn" DROP CONSTRAINT "EventAddOn_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventOrderedStop" DROP CONSTRAINT "EventOrderedStop_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventOrderedStop" DROP CONSTRAINT "EventOrderedStop_locationId_fkey";

-- DropForeignKey
ALTER TABLE "EventProduct" DROP CONSTRAINT "EventProduct_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventWaitlist" DROP CONSTRAINT "EventWaitlist_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventWaitlistGroup" DROP CONSTRAINT "EventWaitlistGroup_eventWaitlistId_fkey";

-- DropForeignKey
ALTER TABLE "_EventWaitlistGroupToUser" DROP CONSTRAINT "_EventWaitlistGroupToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_EventWaitlistGroupToUser" DROP CONSTRAINT "_EventWaitlistGroupToUser_B_fkey";

-- DropTable
DROP TABLE "Event";

-- DropTable
DROP TABLE "EventAddOn";

-- DropTable
DROP TABLE "EventOrderedStop";

-- DropTable
DROP TABLE "EventProduct";

-- DropTable
DROP TABLE "EventWaitlist";

-- DropTable
DROP TABLE "EventWaitlistGroup";

-- DropTable
DROP TABLE "_EventWaitlistGroupToUser";

-- CreateTable
CREATE TABLE "GroupDate" (
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "numSpots" INTEGER NOT NULL,
    "minimumPrice" INTEGER NOT NULL,
    "maximumPrice" INTEGER NOT NULL,
    "tastemakerId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GroupDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupDateOrderedStop" (
    "order" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedTime" INTEGER NOT NULL DEFAULT 60,
    "groupDateId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GroupDateOrderedStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupDateProduct" (
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "groupDateId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GroupDateProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupDateWaitlist" (
    "groupDateId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GroupDateWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupDateWaitlistGroup" (
    "position" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "groupDateWaitlistId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GroupDateWaitlistGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupDateAddOn" (
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "minimumPrice" INTEGER NOT NULL,
    "maximumPrice" INTEGER NOT NULL,
    "groupDateId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GroupDateAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GroupDateWaitlistGroupToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupDateWaitlist_groupDateId_key" ON "GroupDateWaitlist"("groupDateId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupDateWaitlistGroup_code_groupDateWaitlistId_key" ON "GroupDateWaitlistGroup"("code", "groupDateWaitlistId");

-- CreateIndex
CREATE UNIQUE INDEX "_GroupDateWaitlistGroupToUser_AB_unique" ON "_GroupDateWaitlistGroupToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_GroupDateWaitlistGroupToUser_B_index" ON "_GroupDateWaitlistGroupToUser"("B");

-- AddForeignKey
ALTER TABLE "GroupDate" ADD CONSTRAINT "GroupDate_tastemakerId_fkey" FOREIGN KEY ("tastemakerId") REFERENCES "Tastemaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDateOrderedStop" ADD CONSTRAINT "GroupDateOrderedStop_groupDateId_fkey" FOREIGN KEY ("groupDateId") REFERENCES "GroupDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDateOrderedStop" ADD CONSTRAINT "GroupDateOrderedStop_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDateProduct" ADD CONSTRAINT "GroupDateProduct_groupDateId_fkey" FOREIGN KEY ("groupDateId") REFERENCES "GroupDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDateWaitlist" ADD CONSTRAINT "GroupDateWaitlist_groupDateId_fkey" FOREIGN KEY ("groupDateId") REFERENCES "GroupDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDateWaitlistGroup" ADD CONSTRAINT "GroupDateWaitlistGroup_groupDateWaitlistId_fkey" FOREIGN KEY ("groupDateWaitlistId") REFERENCES "GroupDateWaitlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDateAddOn" ADD CONSTRAINT "GroupDateAddOn_groupDateId_fkey" FOREIGN KEY ("groupDateId") REFERENCES "GroupDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupDateWaitlistGroupToUser" ADD CONSTRAINT "_GroupDateWaitlistGroupToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "GroupDateWaitlistGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupDateWaitlistGroupToUser" ADD CONSTRAINT "_GroupDateWaitlistGroupToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
