/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Tastemaker` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Tastemaker` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tastemaker" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tastemaker_userId_key" ON "Tastemaker"("userId");

-- AddForeignKey
ALTER TABLE "Tastemaker" ADD CONSTRAINT "Tastemaker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
