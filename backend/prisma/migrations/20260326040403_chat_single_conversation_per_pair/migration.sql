/*
  Warnings:

  - You are about to drop the column `appointmentId` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Conversation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,facultyId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_appointmentId_fkey";

-- DropIndex
DROP INDEX "Conversation_appointmentId_key";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "appointmentId",
DROP COLUMN "type";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "appointmentId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_studentId_facultyId_key" ON "Conversation"("studentId", "facultyId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
