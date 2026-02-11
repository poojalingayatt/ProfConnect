const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateToken } = require('../utils/jwt');

exports.register = async (data) => {
  const { email, password, name, role, department } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
      department,
    },
  });

  const accessToken = generateToken({
    id: user.id,
    role: user.role,
  });

  delete user.password;

  return { user, accessToken };
};

exports.login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  const accessToken = generateToken({
    id: user.id,
    role: user.role,
  });

  delete user.password;

  return { user, accessToken };
};

exports.getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  delete user.password;

  return user;
};
