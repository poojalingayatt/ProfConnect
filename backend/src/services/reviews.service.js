/**
 * REVIEWS SERVICE
 * ----------------------------------------
 * - Only student can review
 * - Only after COMPLETED
 * - One review per appointment
 * - Auto recalculates faculty rating
 */

const prisma = require('../config/database');


exports.createReview = async (user, data) => {

  const { appointmentId, rating, comment } = data;

  return await prisma.$transaction(async (tx) => {

    // 1️⃣ Fetch appointment
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment)
      throw new Error('Appointment not found');

    // 2️⃣ Must belong to student
    if (appointment.studentId !== user.id)
      throw new Error('Unauthorized');

    // 3️⃣ Only COMPLETED appointments can be reviewed
    if (appointment.status !== 'COMPLETED')
      throw new Error('Only completed appointments can be reviewed');

    // 4️⃣ Create review
    const review = await tx.review.create({
      data: {
        appointmentId,
        studentId: user.id,
        facultyId: appointment.facultyId,
        rating,
        comment,
      },
    });

    // 5️⃣ Recalculate average rating
    const stats = await tx.review.aggregate({
      where: { facultyId: appointment.facultyId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.facultyProfile.update({
      where: { userId: appointment.facultyId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count.rating,
      },
    });

    return review;

  }).catch((error) => {

    // Unique constraint violation
    if (error.code === 'P2002') {
      throw new Error('Review already exists for this appointment');
    }

    throw error;
  });
};


exports.getFacultyReviews = async (facultyId) => {

  return await prisma.review.findMany({
    where: { facultyId },
    orderBy: { createdAt: 'desc' },
  });
};