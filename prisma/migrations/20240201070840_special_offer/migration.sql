/*
  Warnings:

  - You are about to drop the `Badge` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Badge" DROP CONSTRAINT "Badge_categorizedDateListId_fkey";

-- DropTable
DROP TABLE "Badge";

-- CreateTable
CREATE TABLE "SpecialOffer" (
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SpecialOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpecialOffer_title_key" ON "SpecialOffer"("title");
