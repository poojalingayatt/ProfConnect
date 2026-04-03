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
const cloudinary = require('../config/cloudinary');


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

    if (!req.file.mimetype?.startsWith('image/')) {
      return res.status(400).json({ message: 'Avatar must be an image file' });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'profconnect/avatars',
          resource_type: 'image',
          public_id: `user_${req.user.id}`,
          overwrite: true,
          invalidate: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    const avatarUrl = uploadResult?.secure_url;
    if (!avatarUrl) {
      return res.status(500).json({ message: 'Failed to upload avatar' });
    }

    const user = await usersService.updateAvatar(req.user.id, avatarUrl);

    res.json({
      message: 'Avatar updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};
