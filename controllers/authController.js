const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// @route   POST /api/auth/register
// @access  Public
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError("An account with this email already exists.", 409));
  }

  // Only allow self-registration as reader/author.
  // Elevated roles (editor/admin) must be granted by an existing admin.
  const safeRole = ["reader", "author"].includes(role) ? role : "reader";

  const user = await User.create({ name, email, password, role: safeRole });
  const token = generateToken(user);

  res.status(201).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
});

// @route   POST /api/auth/login
// @access  Public
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password.", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError("Incorrect email or password.", 401));
  }

  if (!user.isActive) {
    return next(new AppError("This account has been deactivated.", 403));
  }

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
});

// @route   GET /api/auth/me
// @access  Private
exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    user: req.user.toSafeObject(),
  });
});

// @route   PATCH /api/auth/update-password
// @access  Private
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError("Current password is incorrect.", 401));
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken(user);
  res.status(200).json({ success: true, token });
});
