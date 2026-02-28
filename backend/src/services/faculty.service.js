/**
 * FACULTY SERVICE
 * ----------------------------------------
 * Business logic for:
 * - Searching faculty
 * - Filtering
 * - Getting profile
 */

const prisma = require('../config/database');
const AppError = require('../utils/AppError');

/**
 * Search faculty dynamically
 */
exports.searchFaculty = async ({ search, department, online }) => {

  const filters = {
    role: 'FACULTY',
  };

  if (search) {
    filters.name = {
      contains: search,
      mode: 'insensitive',
    };
  }

  if (department) {
    filters.department = department;
  }

  const faculty = await prisma.user.findMany({
    where: filters,
    include: {
      facultyProfile: {
        include: {
          specializations: true
        }
      },
      followers: true,
    },
  });

  const filtered = online
    ? faculty.filter(f => f.facultyProfile?.isOnline === (online === 'true'))
    : faculty;

  return filtered.map(f => {
    delete f.password;
    delete f.resetToken;
    delete f.resetTokenExpiry;

    return {
      ...f,
      followerCount: f.followers.length,
      officeLocation: f.facultyProfile?.officeLocation || null,
    };
  });
};


/**
 * Get single faculty profile
 */
exports.getFacultyById = async (facultyId) => {

  const faculty = await prisma.user.findFirst({
    where: {
      id: facultyId,
      role: 'FACULTY',
    },
    include: {
      facultyProfile: {
        include: {
          specializations: true
        }
      },
      followers: true,
    },
  });

  if (!faculty) {
    throw new AppError('Faculty not found', 404);
  }

  delete faculty.password;
  delete faculty.resetToken;
  delete faculty.resetTokenExpiry;

  return {
    ...faculty,
    followerCount: faculty.followers.length,
    officeLocation: faculty.facultyProfile?.officeLocation || null,
  };
};
