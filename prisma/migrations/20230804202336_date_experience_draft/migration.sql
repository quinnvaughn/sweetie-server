-- CreateTable
CREATE TABLE "DateExperienceDraft" (
    "title" TEXT,
    "description" TEXT,
    "thumbnail" TEXT,
    "authorId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,
    "zenstack_transaction" TEXT,

    CONSTRAINT "DateExperienceDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateStopDraft" (
    "title" TEXT,
    "content" TEXT,
    "order" INTEGER NOT NULL,
    "experienceId" TEXT NOT NULL,
    "locationId" TEXT,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,
    "zenstack_transaction" TEXT,

    CONSTRAINT "DateStopDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DateExperienceDraftToTimeOfDay" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "DateExperienceDraft_zenstack_transaction_idx" ON "DateExperienceDraft"("zenstack_transaction");

-- CreateIndex
CREATE INDEX "DateExperienceDraft_createdAt_idx" ON "DateExperienceDraft"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "DateStopDraft_zenstack_transaction_idx" ON "DateStopDraft"("zenstack_transaction");

-- CreateIndex
CREATE UNIQUE INDEX "_DateExperienceDraftToTimeOfDay_AB_unique" ON "_DateExperienceDraftToTimeOfDay"("A", "B");

-- CreateIndex
CREATE INDEX "_DateExperienceDraftToTimeOfDay_B_index" ON "_DateExperienceDraftToTimeOfDay"("B");

-- CreateIndex
CREATE INDEX "Country_initials_idx" ON "Country"("initials" ASC);

-- CreateIndex
CREATE INDEX "State_initials_idx" ON "State"("initials" ASC);

-- AddForeignKey
ALTER TABLE "DateExperienceDraft" ADD CONSTRAINT "DateExperienceDraft_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateStopDraft" ADD CONSTRAINT "DateStopDraft_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "DateExperienceDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateStopDraft" ADD CONSTRAINT "DateStopDraft_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DateExperienceDraftToTimeOfDay" ADD CONSTRAINT "_DateExperienceDraftToTimeOfDay_A_fkey" FOREIGN KEY ("A") REFERENCES "DateExperienceDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DateExperienceDraftToTimeOfDay" ADD CONSTRAINT "_DateExperienceDraftToTimeOfDay_B_fkey" FOREIGN KEY ("B") REFERENCES "TimeOfDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
