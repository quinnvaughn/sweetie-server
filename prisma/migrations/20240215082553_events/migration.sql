-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "images" TEXT[];

-- CreateTable
CREATE TABLE "Event" (
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "numSpots" INTEGER NOT NULL,
    "draft" BOOLEAN NOT NULL DEFAULT true,
    "image" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "tastemakerId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventOrderedStop" (
    "locationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "startTimeRange" TIMESTAMP(3)[],
    "eventId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventOrderedStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventProduct" (
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL,
    "providerId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBuffer" (
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "orderedStopId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventBuffer_pkey" PRIMARY KEY ("id")
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
    "waitlistId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventWaitlistGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPurchase" (
    "userId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventProductOption" (
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "hasGratuity" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "eventProductId" TEXT,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventProductOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventProvider" (
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "eventId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EventWaitlistGroupToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "EventWaitlist_eventId_key" ON "EventWaitlist"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventWaitlistGroup_code_waitlistId_key" ON "EventWaitlistGroup"("code", "waitlistId");

-- CreateIndex
CREATE UNIQUE INDEX "_EventWaitlistGroupToUser_AB_unique" ON "_EventWaitlistGroupToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_EventWaitlistGroupToUser_B_index" ON "_EventWaitlistGroupToUser"("B");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_tastemakerId_fkey" FOREIGN KEY ("tastemakerId") REFERENCES "Tastemaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventOrderedStop" ADD CONSTRAINT "EventOrderedStop_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventOrderedStop" ADD CONSTRAINT "EventOrderedStop_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventProduct" ADD CONSTRAINT "EventProduct_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "EventProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBuffer" ADD CONSTRAINT "EventBuffer_orderedStopId_fkey" FOREIGN KEY ("orderedStopId") REFERENCES "EventOrderedStop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventWaitlist" ADD CONSTRAINT "EventWaitlist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventWaitlistGroup" ADD CONSTRAINT "EventWaitlistGroup_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "EventWaitlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPurchase" ADD CONSTRAINT "EventPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPurchase" ADD CONSTRAINT "EventPurchase_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "EventProductOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventProductOption" ADD CONSTRAINT "EventProductOption_eventProductId_fkey" FOREIGN KEY ("eventProductId") REFERENCES "EventProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventProvider" ADD CONSTRAINT "EventProvider_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventWaitlistGroupToUser" ADD CONSTRAINT "_EventWaitlistGroupToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "EventWaitlistGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventWaitlistGroupToUser" ADD CONSTRAINT "_EventWaitlistGroupToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
