-- CreateTable
CREATE TABLE "TastemakerPreference" (
    "cityId" TEXT,
    "tagId" TEXT,
    "specializesInId" TEXT,
    "doesNotDoId" TEXT,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TastemakerPreference_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TastemakerPreference" ADD CONSTRAINT "TastemakerPreference_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TastemakerPreference" ADD CONSTRAINT "TastemakerPreference_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TastemakerPreference" ADD CONSTRAINT "TastemakerPreference_specializesInId_fkey" FOREIGN KEY ("specializesInId") REFERENCES "Tastemaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TastemakerPreference" ADD CONSTRAINT "TastemakerPreference_doesNotDoId_fkey" FOREIGN KEY ("doesNotDoId") REFERENCES "Tastemaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
