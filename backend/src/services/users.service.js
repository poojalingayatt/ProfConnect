/**
 * USERS SERVICE
 * ----------------------------------------
 * This is where business logic lives.
 * 
 * Service layer:
 * - Talks to database
 * - Handles password hashing
 * - Handles comparisons
 * - Throws meaningful errors
 */

const prisma = require('../config/database');
const bcrypt = require('bcryptjs');


/**
 * Get user profile by ID
 */
exports.getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Never return password
  delete user.password;

  return user;
};


/**
 * Update profile fields
 */
exports.updateProfile = async (userId, data) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
    },
  });

  delete user.password;

  return user;
};


/**
 * Secure password update logic
 */
exports.updatePassword = async (userId, { currentPassword, newPassword }) => {

  // 1️⃣ Get user from DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // 2️⃣ Compare current password with stored hash
  const isValid = await bcrypt.compare(currentPassword, user.password);

  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // 3️⃣ Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 4️⃣ Update in DB
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  });

  return true;
};
