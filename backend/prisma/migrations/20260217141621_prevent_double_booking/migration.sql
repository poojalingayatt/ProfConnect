/*
  Warnings:

  - A unique constraint covering the columns `[facultyId,date,slot]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Appointment_facultyId_date_slot_key" ON "Appointment"("facultyId", "date", "slot");
