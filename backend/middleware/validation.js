/**
 * validation.js
 * Collect and handle express-validator errors.
 */
const { validationResult } = require('express-validator');

exports.checkValidation = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    return res.status(400).json({ errors: errs.array() });
  }
  next();
};
