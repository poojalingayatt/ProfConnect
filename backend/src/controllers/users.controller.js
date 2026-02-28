/**
 * USERS CONTROLLER
 * ----------------------------------------
 * This layer:
 * - Receives request from routes
 * - Calls service layer
 * - Sends response back to client
 * 
 * Controllers should NOT contain business logic.
 */

const usersService = require('../services/users.service');


exports.getProfile = async (req, res, next) => {
  try {
    const user = await usersService.getProfile(req.user.id);

    res.json({ user });
  } catch (error) {
    next(error);
  }
};


exports.updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await usersService.updateProfile(
      req.user.id,
      req.body
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};


exports.updatePassword = async (req, res, next) => {
  try {
    await usersService.updatePassword(
      req.user.id,
      req.body
    );

    res.json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const avatarPath = `/uploads/${req.file.filename}`;
    const user = await usersService.updateAvatar(req.user.id, avatarPath);

    res.json({
      message: 'Avatar updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};
