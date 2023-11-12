-- CreateTable
CREATE TABLE "DateSuggestion" (
    "text" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DateSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CityToDateSuggestion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CityToDateSuggestion_AB_unique" ON "_CityToDateSuggestion"("A", "B");

-- CreateIndex
CREATE INDEX "_CityToDateSuggestion_B_index" ON "_CityToDateSuggestion"("B");

-- AddForeignKey
ALTER TABLE "_CityToDateSuggestion" ADD CONSTRAINT "_CityToDateSuggestion_A_fkey" FOREIGN KEY ("A") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CityToDateSuggestion" ADD CONSTRAINT "_CityToDateSuggestion_B_fkey" FOREIGN KEY ("B") REFERENCES "DateSuggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
