-- CreateTable
CREATE TABLE "_CustomDateToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CustomDateToTag_AB_unique" ON "_CustomDateToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_CustomDateToTag_B_index" ON "_CustomDateToTag"("B");

-- AddForeignKey
ALTER TABLE "_CustomDateToTag" ADD CONSTRAINT "_CustomDateToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "CustomDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomDateToTag" ADD CONSTRAINT "_CustomDateToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
