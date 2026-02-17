/**
 * FACULTY SERVICE
 * ----------------------------------------
 * Business logic for:
 * - Searching faculty
 * - Filtering
 * - Getting profile
 */

const prisma = require('../config/database');

/**
 * Search faculty dynamically
 */
exports.searchFaculty = async ({ search, department, online }) => {

  /**
   * We dynamically build a Prisma filter object.
   * This allows flexible searching.
   */
  const filters = {
    role: 'FACULTY', // Only faculty users
  };

  // If search term exists → filter by name
  if (search) {
    filters.name = {
      contains: search,
      mode: 'insensitive', // Case insensitive search
    };
  }

  // Filter by department
  if (department) {
    filters.department = department;
  }

  const faculty = await prisma.user.findMany({
    where: filters,
    include: {
      facultyProfile: true,
      followers: true, // So we can count followers
    },
  });

  // Filter by online status if requested
  const filtered = online
    ? faculty.filter(f => f.facultyProfile?.isOnline === (online === 'true'))
    : faculty;

  // Remove passwords
  return filtered.map(f => {
    delete f.password;

    return {
      ...f,
      followerCount: f.followers.length,
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
      facultyProfile: true,
      followers: true,
    },
  });

  if (!faculty) {
    throw new Error('Faculty not found');
  }

  delete faculty.password;

  return {
    ...faculty,
    followerCount: faculty.followers.length,
  };
};
