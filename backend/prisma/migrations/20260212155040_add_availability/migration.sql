-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" SERIAL NOT NULL,
    "facultyId" INTEGER NOT NULL,
    "day" TEXT NOT NULL,
    "slots" TEXT[],

    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvailabilityRule_facultyId_idx" ON "AvailabilityRule"("facultyId");

-- AddForeignKey
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
