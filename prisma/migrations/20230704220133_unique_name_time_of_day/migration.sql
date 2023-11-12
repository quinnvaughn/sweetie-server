/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `TimeOfDay` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TimeOfDay_name_key" ON "TimeOfDay"("name");
