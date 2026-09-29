const { validationResult } = require("express-validator");

/**
 * Run after an array of express-validator checks on a route.
 * If any check failed, responds with a 400 and the list of messages
 * instead of letting the bad data reach the controller.
 */
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};
