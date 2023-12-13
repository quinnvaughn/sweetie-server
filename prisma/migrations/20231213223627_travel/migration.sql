-- CreateEnum
CREATE TYPE "TravelMode" AS ENUM ('CAR', 'TRAIN', 'PLANE', 'BOAT', 'WALK');

-- CreateTable
CREATE TABLE "Travel" (
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "mode" "TravelMode" NOT NULL,
    "duration" TEXT NOT NULL,
    "distance" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Travel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Travel_fromId_key" ON "Travel"("fromId");

-- CreateIndex
CREATE UNIQUE INDEX "Travel_toId_key" ON "Travel"("toId");

-- AddForeignKey
ALTER TABLE "Travel" ADD CONSTRAINT "Travel_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "DateStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Travel" ADD CONSTRAINT "Travel_toId_fkey" FOREIGN KEY ("toId") REFERENCES "DateStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
