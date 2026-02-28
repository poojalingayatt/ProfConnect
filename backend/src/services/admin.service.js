const prisma = require('../config/database');
const AppError = require('../utils/AppError');

exports.getStats = async () => {
  const [totalUsers, totalFaculty, totalStudents, totalAppointments] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'FACULTY' } }),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.appointment.count(),
  ]);

  return {
    totalUsers,
    totalFaculty,
    totalStudents,
    totalAppointments,
  };
};

exports.getUsers = async () => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      createdAt: true,
    },
  });

  return users;
};

exports.deleteUser = async (currentAdminId, userId) => {
  if (currentAdminId === userId) {
    throw new AppError('Admins cannot delete their own account', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await prisma.user.delete({
    where: { id: userId },
  });
};

exports.getAppointments = async () => {
  const appointments = await prisma.appointment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      faculty: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return appointments;
};

