/*
  Warnings:

  - You are about to alter the column `price` on the `Tastemaker` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `cost` to the `CustomDate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CustomDate" ADD COLUMN     "cost" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Tastemaker" ALTER COLUMN "price" SET DATA TYPE INTEGER;
