-- AlterTable
ALTER TABLE "Message"
ALTER COLUMN "content" DROP NOT NULL,
ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "mediaType" TEXT;
