/*
  Warnings:

  - You are about to drop the column `name` on the `Tag` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[text]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `text` to the `Tag` table without a default value. This is not possible if the table is not empty.

*/
-- Rename the column `name` on the `Tag` table to `text`
ALTER TABLE "Tag" RENAME COLUMN "name" TO "text";
