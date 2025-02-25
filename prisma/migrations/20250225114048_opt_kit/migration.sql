-- DropForeignKey
ALTER TABLE "Flow" DROP CONSTRAINT "Flow_brandKitId_fkey";

-- AlterTable
ALTER TABLE "Flow" ALTER COLUMN "brandKitId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Flow" ADD CONSTRAINT "Flow_brandKitId_fkey" FOREIGN KEY ("brandKitId") REFERENCES "BrandKit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
