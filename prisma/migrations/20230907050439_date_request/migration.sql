-- CreateTable
CREATE TABLE "DateRequest" (
    "creatorId" TEXT NOT NULL,
    "requestorId" TEXT NOT NULL,
    "beginsAt" TIMESTAMP(3) NOT NULL,
    "numStops" INTEGER NOT NULL,
    "priceRangeMin" INTEGER,
    "priceRangeMax" INTEGER,
    "statusId" TEXT NOT NULL,
    "text" TEXT,
    "responsedAt" TIMESTAMP(3),
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateRequestStatus" (
    "name" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DateRequestStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CityToDateRequest" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CityToDateRequest_AB_unique" ON "_CityToDateRequest"("A", "B");

-- CreateIndex
CREATE INDEX "_CityToDateRequest_B_index" ON "_CityToDateRequest"("B");

-- AddForeignKey
ALTER TABLE "DateRequest" ADD CONSTRAINT "DateRequest_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateRequest" ADD CONSTRAINT "DateRequest_requestorId_fkey" FOREIGN KEY ("requestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateRequest" ADD CONSTRAINT "DateRequest_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "DateRequestStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CityToDateRequest" ADD CONSTRAINT "_CityToDateRequest_A_fkey" FOREIGN KEY ("A") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CityToDateRequest" ADD CONSTRAINT "_CityToDateRequest_B_fkey" FOREIGN KEY ("B") REFERENCES "DateRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
