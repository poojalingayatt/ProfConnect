-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "facultyReadAt" TIMESTAMP(3),
ADD COLUMN     "studentReadAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "bytes" INTEGER;
