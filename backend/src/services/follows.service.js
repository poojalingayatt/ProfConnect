/**
 * FOLLOWS SERVICE
 * ----------------------------------------
 * Contains:
 * - Follow logic
 * - Unfollow logic
 * - Duplicate prevention
 * - Ownership validation
 */

const prisma = require('../config/database');
const AppError = require('../utils/AppError');


exports.followFaculty = async (studentId, facultyId) => {

  // Prevent self-follow
  if (studentId === facultyId) {
    throw new AppError('You cannot follow yourself', 400);
  }

  // Check faculty exists
  const faculty = await prisma.user.findFirst({
    where: {
      id: facultyId,
      role: 'FACULTY',
    },
  });

  if (!faculty) {
    throw new AppError('Faculty not found', 404);
  }

  // Create follow (unique constraint prevents duplicate)
  try {
    await prisma.follow.create({
      data: {
        studentId,
        facultyId,
      },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError('Already following this faculty', 409);
    }
    throw error;
  }
};


exports.unfollowFaculty = async (studentId, facultyId) => {
  try {
    await prisma.follow.delete({
      where: {
        studentId_facultyId: {
          studentId,
          facultyId,
        },
      },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new AppError('Follow relationship not found', 404);
    }
    throw error;
  }
};


exports.getMyFollowed = async (studentId) => {

  const follows = await prisma.follow.findMany({
    where: { studentId },
    include: {
      faculty: {
        include: {
          facultyProfile: true,
        },
      },
    },
  });

  return follows.map(f => {
    delete f.faculty.password;
    delete f.faculty.resetToken;
    delete f.faculty.resetTokenExpiry;
    return f.faculty;
  });
};


exports.getMyFollowers = async (facultyId) => {

  const followers = await prisma.follow.findMany({
    where: { facultyId },
    include: {
      student: true,
    },
  });

  return followers.map(f => {
    delete f.student.password;
    delete f.student.resetToken;
    delete f.student.resetTokenExpiry;
    return f.student;
  });
};
