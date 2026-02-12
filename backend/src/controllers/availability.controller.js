/**
 * AVAILABILITY CONTROLLER
 * ----------------------------------------
 * Only handles HTTP logic.
 * Delegates business logic to service layer.
 */

const availabilityService = require('../services/availability.service');


/**
 * Get faculty availability
 */
exports.getFacultyAvailability = async (req, res, next) => {
  try {
    const facultyId = parseInt(req.params.id);

    const availability = await availabilityService.getFacultyAvailability(facultyId);

    res.json({ availability });
  } catch (error) {
    next(error);
  }
};


/**
 * Replace full weekly availability
 */
exports.updateAvailability = async (req, res, next) => {
  try {
    const updated = await availabilityService.updateAvailability(
      req.user.id,
      req.body.availability
    );

    res.json({
      message: 'Availability updated successfully',
      availability: updated,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Update online status
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const updated = await availabilityService.updateStatus(
      req.user.id,
      req.body.isOnline
    );

    res.json({
      message: 'Status updated successfully',
      faculty: updated,
    });
  } catch (error) {
    next(error);
  }
};
