-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleRefreshToken" TEXT,
ALTER COLUMN "password" DROP NOT NULL;
