-- CreateTable
CREATE TABLE "Favorite" (
    "userId" TEXT NOT NULL,
    "freeDateId" TEXT NOT NULL,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","freeDateId")
);

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_freeDateId_fkey" FOREIGN KEY ("freeDateId") REFERENCES "FreeDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
