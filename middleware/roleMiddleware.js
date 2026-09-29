const AppError = require("../utils/AppError");

/**
 * Restricts a route to the given roles.
 * Usage: router.delete('/:id', protect, restrictTo('admin', 'editor'), handler)
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    next();
  };
};

/**
 * Allows the action if the requester owns the resource (req.resourceOwnerId)
 * OR holds one of the given elevated roles. Must run after a middleware
 * that has set req.resourceOwnerId on the request.
 */
exports.ownerOrRoles = (...roles) => {
  return (req, res, next) => {
    const isOwner =
      req.resourceOwnerId &&
      req.user &&
      req.resourceOwnerId.toString() === req.user._id.toString();
    const hasRole = req.user && roles.includes(req.user.role);

    if (!isOwner && !hasRole) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    next();
  };
};
