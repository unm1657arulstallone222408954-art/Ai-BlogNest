const Comment = require("../models/commentModel");
const Post = require("../models/postModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// @route   POST /api/posts/:postId/comments
// @access  Private (any authenticated user)
exports.createComment = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post || post.status !== "published") {
    return next(new AppError("Post not found.", 404));
  }

  const comment = await Comment.create({
    postID: post._id,
    userID: req.user._id,
    text: req.body.text,
    // Readers' comments queue for moderation; staff comments auto-approve.
    moderationStatus: ["admin", "editor"].includes(req.user.role) ? "approved" : "pending",
  });

  res.status(201).json({ success: true, comment });
});

// @route   GET /api/posts/:postId/comments
// Public sees only approved comments; staff can see the full moderation queue.
// @access  Public
exports.getCommentsForPost = catchAsync(async (req, res) => {
  const filter = { postID: req.params.postId };
  const isStaff = req.user && ["admin", "editor"].includes(req.user.role);
  if (!isStaff) filter.moderationStatus = "approved";

  const comments = await Comment.find(filter)
    .populate("userID", "name avatar")
    .sort("-createdAt");

  res.status(200).json({ success: true, count: comments.length, comments });
});

// @route   GET /api/comments/queue
// @access  Private (editor, admin) — moderation queue
exports.getModerationQueue = catchAsync(async (req, res) => {
  const comments = await Comment.find({ moderationStatus: "pending" })
    .populate("userID", "name email")
    .populate("postID", "name")
    .sort("-createdAt");

  res.status(200).json({ success: true, count: comments.length, comments });
});

// @route   PATCH /api/comments/:id/moderate
// @access  Private (editor, admin)
exports.moderateComment = catchAsync(async (req, res, next) => {
  const { moderationStatus } = req.body;
  const validStatuses = ["approved", "pending", "spam"];

  if (!validStatuses.includes(moderationStatus)) {
    return next(new AppError(`Status must be one of: ${validStatuses.join(", ")}`, 400));
  }

  const comment = await Comment.findByIdAndUpdate(
    req.params.id,
    { moderationStatus },
    { new: true }
  );

  if (!comment) return next(new AppError("Comment not found.", 404));
  res.status(200).json({ success: true, comment });
});

// @route   DELETE /api/comments/:id
// @access  Private (comment owner, editor, admin) — prune malicious comments
exports.deleteComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return next(new AppError("Comment not found.", 404));

  const isOwner = comment.userID.toString() === req.user._id.toString();
  const isStaff = ["admin", "editor"].includes(req.user.role);

  if (!isOwner && !isStaff) {
    return next(new AppError("You do not have permission to delete this comment.", 403));
  }

  await comment.deleteOne();
  res.status(204).json({ success: true, data: null });
});
