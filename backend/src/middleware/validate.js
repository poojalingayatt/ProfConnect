exports.validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.validateAsync(req.body, { abortEarly: false });
      next();
    } catch (error) {
      const errors = error.details.map(d => d.message);
      res.status(400).json({ errors });
    }
  };
};
