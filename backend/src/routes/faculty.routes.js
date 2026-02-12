/**
 * FACULTY ROUTES
 * ----------------------------------------
 * These routes are public.
 * No authentication required for searching faculty.
 */

const express = require('express');
const router = express.Router();

// Import controller
const facultyController = require('../controllers/faculty.controller');

/**
 * GET /api/faculty
 * ----------------------------------------
 * Query parameters supported:
 * - search (name filter)
 * - department
 * - online (true/false)
 */
router.get('/', facultyController.getFaculty);


/**
 * GET /api/faculty/:id
 * ----------------------------------------
 * Get detailed faculty profile by ID
 */
router.get('/:id', facultyController.getFacultyById);

module.exports = router;

