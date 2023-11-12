/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `DateRequestStatus` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DateRequestStatus_name_key" ON "DateRequestStatus"("name");
