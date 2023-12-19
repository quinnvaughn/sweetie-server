-- CreateTable
CREATE TABLE "DefaultGuest" (
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,
    "zenstack_transaction" TEXT,

    CONSTRAINT "DefaultGuest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DefaultGuest_userId_key" ON "DefaultGuest"("userId");

-- CreateIndex
CREATE INDEX "DefaultGuest_zenstack_transaction_idx" ON "DefaultGuest"("zenstack_transaction");

-- AddForeignKey
ALTER TABLE "DefaultGuest" ADD CONSTRAINT "DefaultGuest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
