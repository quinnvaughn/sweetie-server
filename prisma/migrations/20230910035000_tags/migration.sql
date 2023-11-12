-- CreateTable
CREATE TABLE "Tag" (
    "name" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DateExperienceToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_DateExperienceDraftToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_DateExperienceToTag_AB_unique" ON "_DateExperienceToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_DateExperienceToTag_B_index" ON "_DateExperienceToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DateExperienceDraftToTag_AB_unique" ON "_DateExperienceDraftToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_DateExperienceDraftToTag_B_index" ON "_DateExperienceDraftToTag"("B");

-- AddForeignKey
ALTER TABLE "_DateExperienceToTag" ADD CONSTRAINT "_DateExperienceToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "DateExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DateExperienceToTag" ADD CONSTRAINT "_DateExperienceToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DateExperienceDraftToTag" ADD CONSTRAINT "_DateExperienceDraftToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "DateExperienceDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DateExperienceDraftToTag" ADD CONSTRAINT "_DateExperienceDraftToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
