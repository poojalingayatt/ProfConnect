-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Specialization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "facultyProfileId" INTEGER NOT NULL,

    CONSTRAINT "Specialization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Specialization_facultyProfileId_idx" ON "Specialization"("facultyProfileId");

-- AddForeignKey
ALTER TABLE "Specialization" ADD CONSTRAINT "Specialization_facultyProfileId_fkey" FOREIGN KEY ("facultyProfileId") REFERENCES "FacultyProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
