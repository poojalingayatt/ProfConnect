-- CreateTable
CREATE TABLE "FacultyProfile" (
    "userId" INTEGER NOT NULL,
    "bio" TEXT,
    "officeLocation" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FacultyProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "facultyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FacultyProfile_userId_idx" ON "FacultyProfile"("userId");

-- CreateIndex
CREATE INDEX "Follow_studentId_idx" ON "Follow"("studentId");

-- CreateIndex
CREATE INDEX "Follow_facultyId_idx" ON "Follow"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_studentId_facultyId_key" ON "Follow"("studentId", "facultyId");

-- AddForeignKey
ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
