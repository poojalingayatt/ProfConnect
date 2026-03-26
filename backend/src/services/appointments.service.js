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
const AppError = require('../utils/AppError');

async function attachConversationIds(user, appointments) {
  if (!appointments.length) {
    return appointments;
  }

  const conversations = await prisma.conversation.findMany({
    where:
      user.role === 'STUDENT'
        ? { studentId: user.id }
        : { facultyId: user.id },
    select: {
      id: true,
      studentId: true,
      facultyId: true,
    },
  });

  const conversationMap = new Map(
    conversations.map((conversation) => [
      `${conversation.studentId}:${conversation.facultyId}`,
      conversation.id,
    ])
  );

  return appointments.map((appointment) => ({
    ...appointment,
    conversationId:
      conversationMap.get(`${appointment.studentId}:${appointment.facultyId}`) ??
      null,
  }));
}

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
      throw new AppError('Faculty not found', 404);
    }

    // 2️⃣ Prevent past booking
    if (new Date(date) < new Date()) {
      throw new AppError('Cannot book past date', 400);
    }

    // 3️⃣ Validate availability
    const parsedDate = new Date(date);
    const weekday = parsedDate.toLocaleDateString('en-US', { weekday: 'long' });

    const availability = await tx.availabilityRule.findFirst({
      where: {
        facultyId,
        OR: [
          { day: weekday },
          { day: weekday.toUpperCase() },
          { day: weekday.toLowerCase() },
        ],
      },
    });

    if (!availability) {
      throw new AppError(
        `Faculty has no availability configured for ${weekday}`,
        400
      );
    }

    const normalize = (s) => (typeof s === 'string' ? s.trim() : s);
    const slotMatches = (inputSlot, storedSlot) => {
      if (!inputSlot || !storedSlot) return false;
      const a = normalize(storedSlot);
      const b = normalize(inputSlot);
      if (a === b) return true;
      if (a.startsWith(b)) return true;
      const start = a.split('-')[0];
      if (start === b) return true;
      if (a.includes(b)) return true;
      return false;
    };

    const slotOk = Array.isArray(availability.slots) && availability.slots.some(s => slotMatches(slot, s));

    if (!slotOk) {
      throw new AppError(
        `Selected slot is not available on ${weekday}`,
        400
      );
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

    await notificationsService.createNotificationWithTx(tx, {
      userId: facultyId,
      type: 'APPOINTMENT_REQUEST',
      title: 'New Appointment Request',
      message: 'You have a new appointment request.',
    });

    return appointment;

  }).catch((error) => {

    // Catch unique constraint violation
    if (error.code === 'P2002') {
      throw new AppError('This slot is already booked', 409);
    }

    throw error;
  });
};


/**
 * Get my appointments
 */
let lastAutoCompleteCheck = new Date(0); // Initialize to epoch time

exports.getMyAppointments = async (user) => {

  const now = new Date();

  // Run auto-completion only once per minute to improve performance
  if (now.getTime() - lastAutoCompleteCheck.getTime() > 60000) {
    // Auto-complete past accepted appointments
    await prisma.appointment.updateMany({
      where: {
        status: 'ACCEPTED',
        date: { lt: now },
      },
      data: {
        status: 'COMPLETED',
      },
    });
    lastAutoCompleteCheck = now;
  }

  if (user.role === 'STUDENT') {
    const appointments = await prisma.appointment.findMany({
      where: { studentId: user.id },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
            facultyProfile: {
              select: { officeLocation: true }
            }
          }
        },
      },
    });

    return attachConversationIds(user, appointments);
  }

  if (user.role === 'FACULTY') {
    const appointments = await prisma.appointment.findMany({
      where: { facultyId: user.id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        }
      },
    });

    return attachConversationIds(user, appointments);
  }

  return [];
};


/**
 * Update status (Faculty only)
 */
exports.acceptAppointment = async (user, appointmentId, duration) => {

  if (!duration || duration < 15 || duration > 180) {
    throw new AppError('Duration must be between 15 and 180 minutes', 400);
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.facultyId !== user.id) {
    throw new AppError('Unauthorized', 403);
  }

  if (appointment.status !== 'PENDING') {
    throw new AppError('Only pending appointments can be accepted', 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const acceptedAppointment = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: 'ACCEPTED', duration: parseInt(duration) },
    });

    const existingConversation = await tx.conversation.findUnique({
      where: {
        studentId_facultyId: {
          studentId: appointment.studentId,
          facultyId: appointment.facultyId,
        },
      },
    });

    if (existingConversation) {
      await tx.conversation.update({
        where: {
          studentId_facultyId: {
            studentId: appointment.studentId,
            facultyId: appointment.facultyId,
          },
        },
        data: {
          isApproved: true,
        },
      });
    } else {
      await tx.conversation.create({
        data: {
          studentId: appointment.studentId,
          facultyId: appointment.facultyId,
          isApproved: true,
        },
      });
    }

    return acceptedAppointment;
  });

  await notificationsService.createNotification({
    userId: appointment.studentId,
    type: 'APPOINTMENT_ACCEPTED',
    title: 'Appointment Accepted',
    message: `Your appointment has been accepted (${duration} min).`,
  });

  return updated;
};


exports.rejectAppointment = async (user, appointmentId, reason) => {

  if (!reason || !reason.trim()) {
    throw new AppError('Rejection reason is required', 400);
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.facultyId !== user.id) {
    throw new AppError('Unauthorized', 403);
  }

  if (appointment.status !== 'PENDING') {
    throw new AppError('Only pending appointments can be rejected', 400);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'REJECTED', rejectionReason: reason.trim() },
  });

  await notificationsService.createNotification({
    userId: appointment.studentId,
    type: 'APPOINTMENT_REJECTED',
    title: 'Appointment Rejected',
    message: `Your appointment was rejected. Reason: ${reason.trim()}`,
  });

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
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.status === 'COMPLETED')
    throw new AppError('Cannot cancel completed appointment', 400);

  // Only student or faculty involved can cancel
  if (
    appointment.studentId !== user.id &&
    appointment.facultyId !== user.id
  ) {
    throw new AppError('Unauthorized', 403);
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
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.status !== 'ACCEPTED') {
      throw new AppError('Only accepted appointments can be rescheduled', 400);
    }

    // Must belong to student
    if (appointment.studentId !== user.id) {
      throw new AppError('Unauthorized', 403);
    }

    if (new Date(date) < new Date()) {
      throw new AppError('Cannot reschedule to past date', 400);
    }

    // Validate availability
    const parsedDate = new Date(date);
    const weekday = parsedDate.toLocaleDateString('en-US', { weekday: 'long' });

    const availability = await tx.availabilityRule.findFirst({
      where: {
        facultyId: appointment.facultyId,
        OR: [
          { day: weekday },
          { day: weekday.toUpperCase() },
          { day: weekday.toLowerCase() },
        ],
      },
    });

    if (!availability) {
      throw new AppError(
        `Faculty has no availability configured for ${weekday}`,
        400
      );
    }

    const normalize = (s) => (typeof s === 'string' ? s.trim() : s);
    const slotMatches = (inputSlot, storedSlot) => {
      if (!inputSlot || !storedSlot) return false;
      const a = normalize(storedSlot);
      const b = normalize(inputSlot);
      if (a === b) return true;
      if (a.startsWith(b)) return true;
      const start = a.split('-')[0];
      if (start === b) return true;
      if (a.includes(b)) return true;
      return false;
    };

    const slotOk = Array.isArray(availability.slots) && availability.slots.some(s => slotMatches(slot, s));

    if (!slotOk) {
      throw new AppError(
        `Selected slot is not available on ${weekday}`,
        400
      );
    }

    // Check for conflicts (exclude current appointment)
    const conflict = await tx.appointment.findFirst({
      where: {
        facultyId: appointment.facultyId,
        date: new Date(date),
        slot,
        NOT: { id: appointmentId },
      },
    });

    if (conflict) {
      throw new AppError('This slot is already booked', 409);
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

    await notificationsService.createNotificationWithTx(tx, {
      userId: appointment.facultyId,
      type: 'RESCHEDULE_REQUESTED',
      title: 'Reschedule Requested',
      message: 'Student requested to reschedule appointment.',
    });

    return updated;

  }).catch((error) => {
    if (error.code === 'P2002') {
      throw new AppError('This slot is already booked', 409);
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

    if (!appointment) throw new AppError('Appointment not found', 404);

    if (appointment.facultyId !== user.id)
      throw new AppError('Unauthorized', 403);

    if (appointment.status !== 'RESCHEDULE_REQUESTED')
      throw new AppError('No reschedule pending', 400);

    // Revalidate slot availability before approval
    const parsedDate = new Date(appointment.date);
    const weekday = parsedDate.toLocaleDateString('en-US', { weekday: 'long' });

    const availability = await tx.availabilityRule.findFirst({
      where: {
        facultyId: appointment.facultyId,
        OR: [
          { day: weekday },
          { day: weekday.toUpperCase() },
          { day: weekday.toLowerCase() },
        ],
      },
    });

    if (!availability) {
      throw new AppError(
        `Faculty has no availability configured for ${weekday}`,
        400
      );
    }

    const normalize = (s) => (typeof s === 'string' ? s.trim() : s);
    const slotMatches = (inputSlot, storedSlot) => {
      if (!inputSlot || !storedSlot) return false;
      const a = normalize(storedSlot);
      const b = normalize(inputSlot);
      if (a === b) return true;
      if (a.startsWith(b)) return true;
      const start = a.split('-')[0];
      if (start === b) return true;
      if (a.includes(b)) return true;
      return false;
    };

    const slotOk = Array.isArray(availability.slots) && availability.slots.some(s => slotMatches(appointment.slot, s));

    if (!slotOk) {
      throw new AppError(
        `Selected slot is not available on ${weekday}`,
        400
      );
    }

    const updated = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: 'ACCEPTED' },
    });

    await notificationsService.createNotificationWithTx(tx, {
      userId: appointment.studentId,
      type: 'RESCHEDULE_APPROVED',
      title: 'Reschedule Approved',
      message: 'Faculty approved the new appointment time.',
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

    if (!appointment) throw new AppError('Appointment not found', 404);

    if (appointment.facultyId !== user.id)
      throw new AppError('Unauthorized', 403);

    if (appointment.status !== 'RESCHEDULE_REQUESTED')
      throw new AppError('No reschedule pending', 400);

    const updated = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: 'ACCEPTED' }, // revert back
    });

    await notificationsService.createNotificationWithTx(tx, {
      userId: appointment.studentId,
      type: 'RESCHEDULE_REJECTED',
      title: 'Reschedule Rejected',
      message: 'Faculty rejected the reschedule request.',
    });

    return updated;
  });
};

