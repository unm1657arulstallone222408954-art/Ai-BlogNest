const Category = require("../models/categoryModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// @route   POST /api/categories
// @access  Private (editor, admin)
exports.createCategory = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  const existing = await Category.findOne({ name: name?.trim() });
  if (existing) return next(new AppError("This category already exists.", 409));

  const category = await Category.create({ name, description });
  res.status(201).json({ success: true, category });
});

// @route   GET /api/categories
// @access  Public
exports.getAllCategories = catchAsync(async (req, res) => {
  const categories = await Category.find().sort("name");
  res.status(200).json({ success: true, count: categories.length, categories });
});

// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError("Category not found.", 404));
  res.status(200).json({ success: true, category });
});

// @route   PATCH /api/categories/:id
// @access  Private (editor, admin)
exports.updateCategory = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name, description },
    { new: true, runValidators: true }
  );
  if (!category) return next(new AppError("Category not found.", 404));
  res.status(200).json({ success: true, category });
});

// @route   DELETE /api/categories/:id
// @access  Private (editor, admin) — category cleanup
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return next(new AppError("Category not found.", 404));
  res.status(204).json({ success: true, data: null });
});
