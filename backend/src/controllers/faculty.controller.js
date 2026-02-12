/**
 * FACULTY CONTROLLER
 * ----------------------------------------
 * This file handles:
 * - Reading query params
 * - Calling service layer
 * - Returning response
 */

const facultyService = require('../services/faculty.service');


/**
 * Search faculty with filters
 */
exports.getFaculty = async (req, res, next) => {
  try {
    // Extract query parameters
    const { search, department, online } = req.query;

    // Pass to service layer
    const faculty = await facultyService.searchFaculty({
      search,
      department,
      online,
    });

    res.json({ faculty });
  } catch (error) {
    next(error);
  }
};


/**
 * Get faculty by ID
 */
exports.getFacultyById = async (req, res, next) => {
  try {
    const facultyId = parseInt(req.params.id);

    const faculty = await facultyService.getFacultyById(facultyId);

    res.json({ faculty });
  } catch (error) {
    next(error);
  }
};
