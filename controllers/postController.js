const Post = require("../models/postModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const APIFeatures = require("../utils/apiFeatures");

// @route   POST /api/posts
// @access  Private (author, editor, admin)
exports.createPost = catchAsync(async (req, res, next) => {
  const { name, message, photo, categories, tags, status, scheduledAt } = req.body;

  const post = await Post.create({
    userID: req.user._id,
    name,
    message,
    photo,
    categories,
    tags,
    // Authors' posts start life in review; editors/admins may publish directly.
    status: ["editor", "admin"].includes(req.user.role) ? status || "draft" : "pending",
    scheduledAt,
  });

  res.status(201).json({ success: true, post });
});

// @route   GET /api/posts
// Public readers see only published posts; authenticated staff can filter by status.
// @access  Public
exports.getAllPosts = catchAsync(async (req, res) => {
  const baseFilter = {};
  const isStaff = req.user && ["admin", "editor"].includes(req.user.role);

  if (!isStaff) {
    baseFilter.status = "published";
  }

  const features = new APIFeatures(Post.find(baseFilter), req.query)
    .search(["name", "message", "tags"])
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const posts = await features.query.populate("userID", "name email role").populate("categories", "name slug");

  res.status(200).json({ success: true, count: posts.length, posts });
});

// @route   GET /api/posts/mine
// @access  Private — author's own posts across all statuses
exports.getMyPosts = catchAsync(async (req, res) => {
  const features = new APIFeatures(Post.find({ userID: req.user._id }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const posts = await features.query;
  res.status(200).json({ success: true, count: posts.length, posts });
});

// @route   GET /api/posts/:id
// @access  Public (published) / Private (owner or staff for other statuses)
exports.getPost = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id)
    .populate("userID", "name email role")
    .populate("categories", "name slug");

  if (!post) return next(new AppError("Post not found.", 404));

  const isOwner = req.user && post.userID._id.toString() === req.user._id.toString();
  const isStaff = req.user && ["admin", "editor"].includes(req.user.role);

  if (post.status !== "published" && !isOwner && !isStaff) {
    return next(new AppError("Post not found.", 404));
  }

  if (post.status === "published") {
    post.views += 1;
    await post.save({ validateBeforeSave: false });
  }

  res.status(200).json({ success: true, post });
});

// @route   PATCH /api/posts/:id
// @access  Private (owner author, editor, admin)
exports.updatePost = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError("Post not found.", 404));

  const isOwner = post.userID.toString() === req.user._id.toString();
  const isStaff = ["admin", "editor"].includes(req.user.role);

  if (!isOwner && !isStaff) {
    return next(new AppError("You do not have permission to edit this post.", 403));
  }

  // Authors editing their own post cannot change publish status directly;
  // that has to go through the editorial review flow.
  const allowedFields = ["name", "message", "photo", "categories", "tags", "scheduledAt"];
  if (isStaff) allowedFields.push("status");

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) post[field] = req.body[field];
  });

  await post.save();
  res.status(200).json({ success: true, post });
});

// @route   PATCH /api/posts/:id/status
// @access  Private (editor, admin) — change publishing status
exports.updatePostStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ["draft", "pending", "scheduled", "published"];

  if (!validStatuses.includes(status)) {
    return next(new AppError(`Status must be one of: ${validStatuses.join(", ")}`, 400));
  }

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!post) return next(new AppError("Post not found.", 404));
  res.status(200).json({ success: true, post });
});

// @route   DELETE /api/posts/:id
// @access  Private (owner author, editor, admin)
exports.deletePost = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError("Post not found.", 404));

  const isOwner = post.userID.toString() === req.user._id.toString();
  const isStaff = ["admin", "editor"].includes(req.user.role);

  if (!isOwner && !isStaff) {
    return next(new AppError("You do not have permission to delete this post.", 403));
  }

  await post.deleteOne();
  res.status(204).json({ success: true, data: null });
});

// @route   PATCH /api/posts/:id/like
// @access  Private (any authenticated user)
exports.likePost = catchAsync(async (req, res, next) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { likes: 1 } },
    { new: true }
  );
  if (!post) return next(new AppError("Post not found.", 404));
  res.status(200).json({ success: true, likes: post.likes });
});

// @route   GET /api/posts/analytics/mine
// @access  Private (author) — post-performance data for the logged-in author
exports.getMyAnalytics = catchAsync(async (req, res) => {
  const stats = await Post.aggregate([
    { $match: { userID: req.user._id } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalLikes: { $sum: "$likes" },
      },
    },
  ]);

  res.status(200).json({ success: true, stats });
});
