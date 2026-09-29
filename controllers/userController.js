const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const APIFeatures = require("../utils/apiFeatures");

// @route   GET /api/users
// @access  Private (admin)
exports.getAllUsers = catchAsync(async (req, res) => {
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const users = await features.query;
  res.status(200).json({ success: true, count: users.length, users });
});

// @route   GET /api/users/:id
// @access  Private (admin)
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError("User not found.", 404));
  res.status(200).json({ success: true, user });
});

// @route   PATCH /api/users/:id/role
// @access  Private (admin) — orchestrates user privilege upgrades
exports.updateUserRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  const validRoles = ["admin", "editor", "author", "reader"];

  if (!validRoles.includes(role)) {
    return next(new AppError(`Role must be one of: ${validRoles.join(", ")}`, 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) return next(new AppError("User not found.", 404));

  res.status(200).json({ success: true, user });
});

// @route   PATCH /api/users/:id/deactivate
// @access  Private (admin)
exports.setUserActiveStatus = catchAsync(async (req, res, next) => {
  const { isActive } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: !!isActive },
    { new: true }
  );

  if (!user) return next(new AppError("User not found.", 404));
  res.status(200).json({ success: true, user });
});

// @route   DELETE /api/users/:id
// @access  Private (admin)
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError("User not found.", 404));
  res.status(204).json({ success: true, data: null });
});
