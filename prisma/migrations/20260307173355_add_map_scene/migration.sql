-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "mapSceneId" TEXT;

-- CreateTable
CREATE TABLE "MapScene" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "models" TEXT NOT NULL DEFAULT '[]',
    "centerLng" DOUBLE PRECISION NOT NULL DEFAULT 108.2208,
    "centerLat" DOUBLE PRECISION NOT NULL DEFAULT 16.0678,
    "zoom" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "pitch" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "bearing" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapScene_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_mapSceneId_fkey" FOREIGN KEY ("mapSceneId") REFERENCES "MapScene"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapScene" ADD CONSTRAINT "MapScene_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
