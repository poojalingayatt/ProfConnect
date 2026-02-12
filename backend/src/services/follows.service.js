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


exports.followFaculty = async (studentId, facultyId) => {

  // Prevent self-follow
  if (studentId === facultyId) {
    throw new Error('You cannot follow yourself');
  }

  // Check faculty exists
  const faculty = await prisma.user.findFirst({
    where: {
      id: facultyId,
      role: 'FACULTY',
    },
  });

  if (!faculty) {
    throw new Error('Faculty not found');
  }

  // Create follow (unique constraint prevents duplicate)
  await prisma.follow.create({
    data: {
      studentId,
      facultyId,
    },
  });
};


exports.unfollowFaculty = async (studentId, facultyId) => {
  await prisma.follow.delete({
    where: {
      studentId_facultyId: {
        studentId,
        facultyId,
      },
    },
  });
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
    return f.student;
  });
};
