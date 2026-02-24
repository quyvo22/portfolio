-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "imageAlt" TEXT,
ADD COLUMN     "imageHeight" INTEGER,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "imageWidth" INTEGER;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "imageAlt" TEXT,
ADD COLUMN     "imageHeight" INTEGER,
ADD COLUMN     "imageWidth" INTEGER;
