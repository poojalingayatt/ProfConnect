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
const AppError = require('../utils/AppError');


/**
 * Get user profile by ID
 */
exports.getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      facultyProfile: {
        include: {
          specializations: true
        }
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  delete user.password;
  delete user.resetToken;
  delete user.resetTokenExpiry;

  return user;
};


/**
 * Update profile fields
 */
exports.updateProfile = async (userId, data) => {
  const { specializations, bio, officeLocation, name, phone, avatar, department } = data;

  // Validate specializations if provided
  if (specializations) {
    if (!Array.isArray(specializations)) {
      throw new AppError('Specializations must be an array', 400);
    }
    if (specializations.some(s => !s || typeof s !== 'string' || !s.trim())) {
      throw new AppError('Specializations cannot contain empty values', 400);
    }
  }

  // Validate phone if provided
  if (phone && !/^[0-9]{10,15}$/.test(phone)) {
    throw new AppError('Phone must be 10-15 digits', 400);
  }

  // Validate department if provided
  if (department && department.length > 100) {
    throw new AppError('Department name too long', 400);
  }

  // Check user role OUTSIDE the transaction (read-only, role is immutable)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Run only write operations inside the transaction
  await prisma.$transaction(async (tx) => {
    // Update User table
    const userUpdateData = {};
    if (name !== undefined) userUpdateData.name = name;
    if (phone !== undefined) userUpdateData.phone = phone;
    if (avatar !== undefined) userUpdateData.avatar = avatar;
    if (department !== undefined) userUpdateData.department = department;

    if (Object.keys(userUpdateData).length > 0) {
      await tx.user.update({
        where: { id: userId },
        data: userUpdateData
      });
    }

    // Handle faculty-specific fields
    if (user.role === 'FACULTY') {
      const facultyUpdateData = {};
      if (bio !== undefined) facultyUpdateData.bio = bio;
      if (officeLocation !== undefined) facultyUpdateData.officeLocation = officeLocation;

      // Combine the two upserts — ensure profile exists AND update fields in one call
      if (Object.keys(facultyUpdateData).length > 0 || specializations !== undefined) {
        await tx.facultyProfile.upsert({
          where: { userId },
          create: { userId, ...facultyUpdateData },
          update: facultyUpdateData
        });
      }

      // Handle specializations
      if (specializations !== undefined) {
        // Delete all existing specializations
        await tx.specialization.deleteMany({
          where: { facultyProfileId: userId }
        });

        // Create new specializations
        if (specializations.length > 0) {
          await tx.specialization.createMany({
            data: specializations.map(name => ({
              name: name.trim(),
              facultyProfileId: userId
            }))
          });
        }
      }
    }
  });

  // Fetch and return updated user OUTSIDE the transaction
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      facultyProfile: {
        include: {
          specializations: true
        }
      }
    }
  });

  delete updatedUser.password;
  delete updatedUser.resetToken;
  delete updatedUser.resetTokenExpiry;

  return updatedUser;
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
    throw new AppError('User not found', 404);
  }

  // 2️⃣ Compare current password with stored hash
  const isValid = await bcrypt.compare(currentPassword, user.password);

  if (!isValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // 3️⃣ Check if new password is same as current
  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame) {
    throw new AppError('New password cannot be same as current password', 400);
  }

  // 4️⃣ Validate new password length
  if (newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  // 5️⃣ Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // 6️⃣ Update in DB
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  });

  return true;
};

exports.updateAvatar = async (userId, avatarPath) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarPath },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      phone: true,
      avatar: true
    }
  });

  return user;
};
