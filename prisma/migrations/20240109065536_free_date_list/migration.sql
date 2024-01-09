-- CreateTable
CREATE TABLE "FreeDateList" (
    "title" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FreeDateList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FreeDateToFreeDateList" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_FreeDateToFreeDateList_AB_unique" ON "_FreeDateToFreeDateList"("A", "B");

-- CreateIndex
CREATE INDEX "_FreeDateToFreeDateList_B_index" ON "_FreeDateToFreeDateList"("B");

-- AddForeignKey
ALTER TABLE "_FreeDateToFreeDateList" ADD CONSTRAINT "_FreeDateToFreeDateList_A_fkey" FOREIGN KEY ("A") REFERENCES "FreeDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreeDateToFreeDateList" ADD CONSTRAINT "_FreeDateToFreeDateList_B_fkey" FOREIGN KEY ("B") REFERENCES "FreeDateList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
