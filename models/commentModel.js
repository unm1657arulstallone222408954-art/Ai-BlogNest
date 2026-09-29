const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    postID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      maxlength: 1000,
    },
    moderationStatus: {
      type: String,
      enum: ["approved", "pending", "spam"],
      default: "pending",
    },
  },
  { timestamps: true }
);

commentSchema.index({ postID: 1, moderationStatus: 1 });

module.exports = mongoose.model("Comment", commentSchema);
