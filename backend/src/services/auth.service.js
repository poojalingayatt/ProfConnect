const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/database');
const { generateToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

exports.register = async (data) => {
  const { email, password, name, role, department } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
      department,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      avatar: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const accessToken = generateToken({
    id: user.id,
    role: user.role,
  });

  return { user, accessToken };
};

exports.login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      avatar: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      password: true,
    },
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  const accessToken = generateToken({
    id: user.id,
    role: user.role,
  });

  const { password: _password, ...safeUser } = user;

  return { user: safeUser, accessToken };
};

exports.getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      avatar: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      facultyProfile: {
        select: {
          userId: true,
          bio: true,
          officeLocation: true,
          isOnline: true,
          rating: true,
          reviewCount: true,
          specializations: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

exports.forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if email exists
    return { message: 'If the email is registered, a reset link will be sent.' };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: expiry,
    },
  });

  // TODO: Deliver resetToken via email (not hashedToken); email delivery integration pending.
  return { message: 'If the email is registered, a reset link will be sent.' };
};

exports.resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return { message: 'Password reset successfully' };
};
