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


/**
 * Get logged-in user profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    // req.user is attached by auth middleware
    const user = await usersService.getProfile(req.user.id);

    res.json({ user });
  } catch (error) {
    next(error); // Pass to global error handler
  }
};


/**
 * Update user profile
 */
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


/**
 * Update password
 */
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
