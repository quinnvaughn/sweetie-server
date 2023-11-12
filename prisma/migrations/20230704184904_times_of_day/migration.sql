-- CreateTable
CREATE TABLE "TimeOfDay" (
    "name" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TimeOfDay_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TimeOfDay" ADD CONSTRAINT "TimeOfDay_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "DateExperience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
