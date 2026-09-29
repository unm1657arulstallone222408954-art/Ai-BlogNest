const aiService = require("../services/aiService");
const Post = require("../models/postModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// @route   POST /api/ai/generate-blog
// @access  Private (author, editor, admin)
// Generates a full blog post draft from a topic and optionally saves it.
exports.generateBlog = catchAsync(async (req, res, next) => {
  const { topic, tone, length, save } = req.body;

  const generated = await aiService.generateBlog({ topic, tone, length });

  if (!save) {
    return res.status(200).json({ success: true, generated });
  }

  const post = await Post.create({
    userID: req.user._id,
    name: generated.title,
    message: generated.content,
    summary: generated.summary,
    tags: generated.tags,
    status: "draft",
    aiGenerated: true,
  });

  res.status(201).json({ success: true, post });
});

// @route   POST /api/ai/summarize
// @access  Private
// Summarizes arbitrary content, or an existing post if postId is supplied.
exports.summarize = catchAsync(async (req, res, next) => {
  const { content, postId, maxSentences, save } = req.body;

  let textToSummarize = content;
  let post = null;

  if (postId) {
    post = await Post.findById(postId);
    if (!post) return next(new AppError("Post not found.", 404));
    textToSummarize = post.message;
  }

  if (!textToSummarize) {
    return next(new AppError("Provide either 'content' or a valid 'postId'.", 400));
  }

  const result = await aiService.summarizeContent({
    content: textToSummarize,
    maxSentences,
  });

  if (save && post) {
    post.summary = result.summary;
    await post.save({ validateBeforeSave: false });
    return res.status(200).json({ success: true, post });
  }

  res.status(200).json({ success: true, summary: result.summary });
});

// @route   POST /api/ai/faq
// @access  Public — AI FAQ assistance for readers
exports.faq = catchAsync(async (req, res, next) => {
  const { question, context } = req.body;
  const result = await aiService.answerFAQ({ question, context });
  res.status(200).json({ success: true, answer: result.answer });
});
