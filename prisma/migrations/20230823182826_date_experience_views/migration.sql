-- CreateTable
CREATE TABLE "DateExperienceViews" (
    "views" BIGINT NOT NULL DEFAULT 0,
    "experienceId" TEXT NOT NULL,
    "lastViewedAt" TIMESTAMP(3) NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DateExperienceViews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DateExperienceViews_experienceId_key" ON "DateExperienceViews"("experienceId");

-- AddForeignKey
ALTER TABLE "DateExperienceViews" ADD CONSTRAINT "DateExperienceViews_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "DateExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
