const Joi = require('joi');

/**
 * REGISTRATION VALIDATION
 */
exports.registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).required(),
  role: Joi.string().valid('STUDENT', 'FACULTY').required(),
  department: Joi.string().optional(),
});

/**
 * LOGIN VALIDATION
 */
exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/**
 * PROFILE UPDATE VALIDATION
 */
exports.updateProfileSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  department: Joi.string().optional(),
});

/**
 * PASSWORD UPDATE VALIDATION
 */
exports.updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

/**
 * AVAILABILITY UPDATE VALIDATION
 * Expects full weekly availability array
 */
exports.updateAvailabilitySchema = Joi.object({
  availability: Joi.array().items(
    Joi.object({
      day: Joi.string().required(),
      slots: Joi.array().items(Joi.string()).required(),
    })
  ).required(),
});


/**
 * ONLINE STATUS UPDATE VALIDATION
 */
exports.updateStatusSchema = Joi.object({
  isOnline: Joi.boolean().required(),
});
