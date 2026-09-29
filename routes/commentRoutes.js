const express = require("express");
const { body } = require("express-validator");
const commentController = require("../controllers/commentController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");

// mergeParams lets this router read :postId when mounted under /api/posts/:postId/comments
const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(optionalAuth, commentController.getCommentsForPost)
  .post(
    protect,
    [body("text").trim().notEmpty().withMessage("Comment text is required.")],
    validateRequest,
    commentController.createComment
  );

// Standalone moderation routes, mounted separately at /api/comments
const moderationRouter = express.Router();
moderationRouter.get(
  "/queue",
  protect,
  restrictTo("editor", "admin"),
  commentController.getModerationQueue
);
moderationRouter.patch(
  "/:id/moderate",
  protect,
  restrictTo("editor", "admin"),
  commentController.moderateComment
);
moderationRouter.delete("/:id", protect, commentController.deleteComment);

module.exports = { commentRouter: router, moderationRouter };
