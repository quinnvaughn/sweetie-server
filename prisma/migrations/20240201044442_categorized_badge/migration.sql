-- CreateTable
CREATE TABLE "Badge" (
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "categorizedDateListId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Badge_title_key" ON "Badge"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_categorizedDateListId_key" ON "Badge"("categorizedDateListId");

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_categorizedDateListId_fkey" FOREIGN KEY ("categorizedDateListId") REFERENCES "CategorizedDateList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
