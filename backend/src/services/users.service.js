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
  const { specializations, bio, ...userData } = data;

  const user = await prisma.user.update({
    where: { id: userId },
    data: userData,
    include: {
      facultyProfile: {
        include: {
          specializations: true
        }
      }
    }
  });

  // Handle bio and specializations for faculty
  if (user.role === 'FACULTY' && (bio !== undefined || specializations)) {
    // Ensure faculty profile exists and update bio
    await prisma.facultyProfile.upsert({
      where: { userId },
      create: { userId, bio: bio || null },
      update: { ...(bio !== undefined ? { bio } : {}) }
    });

    // Handle specializations if provided
    if (specializations) {
      // Delete old specializations
      await prisma.specialization.deleteMany({
        where: { facultyProfileId: userId }
      });

      // Create new specializations
      if (Array.isArray(specializations) && specializations.length > 0) {
        await prisma.specialization.createMany({
          data: specializations.map(name => ({
            name,
            facultyProfileId: userId
          }))
        });
      }
    }

    // Refetch with specializations
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
  }

  delete user.password;
  delete user.resetToken;
  delete user.resetTokenExpiry;

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
