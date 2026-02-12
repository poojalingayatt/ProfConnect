/**
 * APPOINTMENTS SERVICE
 * ----------------------------------------
 * Contains:
 * - Booking logic
 * - Conflict detection
 * - Slot validation
 * - Role ownership checks
 * - Status transitions
 */

const prisma = require('../config/database');


/**
 * Create appointment
 */
exports.createAppointment = async (user, data) => {

  const { facultyId, date, slot, title, description } = data;

  // 1️⃣ Ensure faculty exists
  const faculty = await prisma.user.findFirst({
    where: {
      id: facultyId,
      role: 'FACULTY',
    },
  });

  if (!faculty) {
    throw new Error('Faculty not found');
  }

  // 2️⃣ Prevent booking past date
  if (new Date(date) < new Date()) {
    throw new Error('Cannot book past date');
  }

  // 3️⃣ Check faculty availability
  const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

  const availability = await prisma.availabilityRule.findFirst({
    where: {
      facultyId,
      day,
    },
  });

  if (!availability || !availability.slots.includes(slot)) {
    throw new Error('Selected slot not available');
  }

  // 4️⃣ Conflict detection
  const existing = await prisma.appointment.findFirst({
    where: {
      facultyId,
      date: new Date(date),
      slot,
      status: {
        in: ['PENDING', 'ACCEPTED'],
      },
    },
  });

  if (existing) {
    throw new Error('Slot already booked');
  }

  // 5️⃣ Create appointment
  const appointment = await prisma.appointment.create({
    data: {
      studentId: user.id,
      facultyId,
      date: new Date(date),
      slot,
      title,
      description,
    },
  });

  return appointment;
};


/**
 * Get my appointments
 */
exports.getMyAppointments = async (user) => {

  if (user.role === 'STUDENT') {
    return await prisma.appointment.findMany({
      where: { studentId: user.id },
    });
  }

  if (user.role === 'FACULTY') {
    return await prisma.appointment.findMany({
      where: { facultyId: user.id },
    });
  }

  return [];
};


/**
 * Update status (Faculty only)
 */
exports.updateStatus = async (user, appointmentId, status) => {

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Ensure faculty owns it
  if (appointment.facultyId !== user.id) {
    throw new Error('Unauthorized');
  }

  return await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
  });
};


/**
 * Cancel appointment
 */
exports.cancelAppointment = async (user, appointmentId) => {

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Only student or faculty involved can cancel
  if (
    appointment.studentId !== user.id &&
    appointment.facultyId !== user.id
  ) {
    throw new Error('Unauthorized');
  }

  return await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'CANCELLED' },
  });
};
