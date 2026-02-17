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
const notificationsService = require('./notifications.service');

/**
 * Create appointment
 */
exports.createAppointment = async (user, data) => {

  const { facultyId, date, slot, title, description } = data;

  return await prisma.$transaction(async (tx) => {

    // 1️⃣ Validate faculty exists
    const faculty = await tx.user.findFirst({
      where: { id: facultyId, role: 'FACULTY' },
    });

    if (!faculty) {
      throw new Error('Faculty not found');
    }

    // 2️⃣ Prevent past booking
    if (new Date(date) < new Date()) {
      throw new Error('Cannot book past date');
    }

    // 3️⃣ Validate availability
    const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

    const availability = await tx.availabilityRule.findFirst({
      where: { facultyId, day },
    });

    if (!availability || !availability.slots.includes(slot)) {
      throw new Error('Selected slot not available');
    }

    // 4️⃣ Create appointment directly
    // No manual conflict check needed anymore!
    // DB unique constraint will handle it.

    const appointment = await tx.appointment.create({
      data: {
        studentId: user.id,
        facultyId,
        date: new Date(date),
        slot,
        title,
        description,
      },
    });

    // 5️⃣ Create notification for faculty
    await tx.notification.create({
      data: {
        userId: facultyId,
        type: 'APPOINTMENT_REQUEST',
        title: 'New Appointment Request',
        message: `You have a new appointment request.`,
      },
    });

    return appointment;

  }).catch((error) => {

    // Catch unique constraint violation
    if (error.code === 'P2002') {
      throw new Error('Slot already booked');
    }

    throw error;
  });
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

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
  });

  if (status === 'ACCEPTED' || status === 'REJECTED') {
    await notificationsService.createNotification({
      userId: appointment.studentId,
      type: status === 'ACCEPTED' ? 'APPOINTMENT_ACCEPTED' : 'APPOINTMENT_REJECTED',
      title: `Appointment ${status}`,
      message: `Your appointment request has been ${status.toLowerCase()}.`,
    });
  }

  return updated;
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

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'CANCELLED' },
  });

  const cancelledByStudent = user.id === appointment.studentId;
  const notifyUserId = cancelledByStudent ? appointment.facultyId : appointment.studentId;

  await notificationsService.createNotification({
    userId: notifyUserId,
    type: 'APPOINTMENT_CANCELLED',
    title: 'Appointment Cancelled',
    message: cancelledByStudent
      ? 'A student cancelled an appointment.'
      : 'A faculty member cancelled an appointment.',
  });

  return updated;
};


/**
 * Request reschedule (Student only)
 */
exports.requestReschedule = async (user, appointmentId, data) => {

  const { date, slot } = data;

  return await prisma.$transaction(async (tx) => {

    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Must belong to student
    if (appointment.studentId !== user.id) {
      throw new Error('Unauthorized');
    }

    // Only ACCEPTED can be rescheduled
    if (appointment.status !== 'ACCEPTED') {
      throw new Error('Only accepted appointments can be rescheduled');
    }

    if (new Date(date) < new Date()) {
      throw new Error('Cannot reschedule to past date');
    }

    // Validate availability
    const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

    const availability = await tx.availabilityRule.findFirst({
      where: { facultyId: appointment.facultyId, day },
    });

    if (!availability || !availability.slots.includes(slot)) {
      throw new Error('Selected slot not available');
    }

    // Store proposed changes temporarily
    const updated = await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'RESCHEDULE_REQUESTED',
        date: new Date(date),
        slot,
      },
    });

    // Notify faculty
    await tx.notification.create({
      data: {
        userId: appointment.facultyId,
        type: 'APPOINTMENT_REQUEST',
        title: 'Reschedule Requested',
        message: 'Student requested to reschedule appointment.',
      },
    });

    return updated;

  }).catch((error) => {
    if (error.code === 'P2002') {
      throw new Error('Slot already booked');
    }
    throw error;
  });
};

  // Approve reschedule (Faculty only)
exports.approveReschedule = async (user, appointmentId) => {

  return await prisma.$transaction(async (tx) => {

    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) throw new Error('Appointment not found');

    if (appointment.facultyId !== user.id)
      throw new Error('Unauthorized');

    if (appointment.status !== 'RESCHEDULE_REQUESTED')
      throw new Error('No reschedule pending');

    const updated = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: 'ACCEPTED' },
    });

    await tx.notification.create({
      data: {
        userId: appointment.studentId,
        type: 'APPOINTMENT_ACCEPTED',
        title: 'Reschedule Approved',
        message: 'Faculty approved the new appointment time.',
      },
    });

    return updated;
  });
};

  // Reject reschedule (Faculty only)
exports.rejectReschedule = async (user, appointmentId) => {

  return await prisma.$transaction(async (tx) => {

    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) throw new Error('Appointment not found');

    if (appointment.facultyId !== user.id)
      throw new Error('Unauthorized');

    if (appointment.status !== 'RESCHEDULE_REQUESTED')
      throw new Error('No reschedule pending');

    const updated = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: 'ACCEPTED' }, // revert back
    });

    await tx.notification.create({
      data: {
        userId: appointment.studentId,
        type: 'APPOINTMENT_REJECTED',
        title: 'Reschedule Rejected',
        message: 'Faculty rejected the reschedule request.',
      },
    });

    return updated;
  });
};

