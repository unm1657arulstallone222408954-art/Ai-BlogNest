const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      // Title of the post
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    message: {
      // Core content body
      type: String,
      required: [true, "Post content is required"],
    },
    summary: {
      type: String,
      default: "",
      maxlength: 500,
    },
    photo: {
      type: String, // pathway / URL to media asset
      default: "",
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "pending", "scheduled", "published"],
      default: "draft",
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    likes: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Text index for search across title, content and tags
postSchema.index({ name: "text", message: "text", tags: "text" });
postSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
