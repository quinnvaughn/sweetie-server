-- DropForeignKey
ALTER TABLE "OrderedDateStop" DROP CONSTRAINT "OrderedDateStop_freeDateId_fkey";

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "images" TEXT[];

-- CreateTable
CREATE TABLE "Event" (
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

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventOrderedStop" (
    "order" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventOrderedStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventProduct" (
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "eventId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventWaitlist" (
    "eventId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventWaitlistGroup" (
    "code" TEXT NOT NULL,
    "eventWaitlistId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventWaitlistGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAddOn" (
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "minimumPrice" INTEGER NOT NULL,
    "maximumPrice" INTEGER NOT NULL,
    "eventId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EventWaitlistGroupToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "EventWaitlist_eventId_key" ON "EventWaitlist"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventWaitlistGroup_code_eventWaitlistId_key" ON "EventWaitlistGroup"("code", "eventWaitlistId");

-- CreateIndex
CREATE UNIQUE INDEX "_EventWaitlistGroupToUser_AB_unique" ON "_EventWaitlistGroupToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_EventWaitlistGroupToUser_B_index" ON "_EventWaitlistGroupToUser"("B");

-- AddForeignKey
ALTER TABLE "OrderedDateStop" ADD CONSTRAINT "OrderedDateStop_freeDateId_fkey" FOREIGN KEY ("freeDateId") REFERENCES "FreeDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_tastemakerId_fkey" FOREIGN KEY ("tastemakerId") REFERENCES "Tastemaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventOrderedStop" ADD CONSTRAINT "EventOrderedStop_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventOrderedStop" ADD CONSTRAINT "EventOrderedStop_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventProduct" ADD CONSTRAINT "EventProduct_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventWaitlist" ADD CONSTRAINT "EventWaitlist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventWaitlistGroup" ADD CONSTRAINT "EventWaitlistGroup_eventWaitlistId_fkey" FOREIGN KEY ("eventWaitlistId") REFERENCES "EventWaitlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAddOn" ADD CONSTRAINT "EventAddOn_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventWaitlistGroupToUser" ADD CONSTRAINT "_EventWaitlistGroupToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "EventWaitlistGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventWaitlistGroupToUser" ADD CONSTRAINT "_EventWaitlistGroupToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
