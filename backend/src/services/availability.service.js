/**
 * AVAILABILITY SERVICE
 * ----------------------------------------
 * Business logic:
 * - Fetch availability
 * - Replace availability safely
 * - Update online status
 */

const prisma = require('../config/database');


/**
 * Get availability of a faculty
 */
exports.getFacultyAvailability = async (facultyId) => {

  // Verify faculty exists
  const faculty = await prisma.user.findFirst({
    where: {
      id: facultyId,
      role: 'FACULTY',
    },
  });

  if (!faculty) {
    throw new Error('Faculty not found');
  }

  // Fetch availability rules
  const availability = await prisma.availabilityRule.findMany({
    where: { facultyId },
  });

  return availability;
};


/**
 * Replace entire weekly availability
 * 
 * Why replace?
 * Simpler and safer than partial updates.
 */
exports.updateAvailability = async (facultyId, availabilityArray) => {

  // Use transaction to ensure atomic operation
  return await prisma.$transaction(async (tx) => {

    // 1️⃣ Delete existing availability
    await tx.availabilityRule.deleteMany({
      where: { facultyId },
    });

    // 2️⃣ Insert new availability
    const created = await Promise.all(
      availabilityArray.map(rule =>
        tx.availabilityRule.create({
          data: {
            facultyId,
            day: rule.day,
            slots: rule.slots,
          },
        })
      )
    );

    return created;
  });
};


/**
 * Update online status
 */
exports.updateStatus = async (facultyId, isOnline) => {

  const updated = await prisma.user.update({
    where: { id: facultyId },
    data: {
      facultyProfile: {
        update: {
          isOnline,
        },
      },
    },
    include: {
      facultyProfile: true,
    },
  });

  delete updated.password;

  return updated;
};
