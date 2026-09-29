const express = require("express");
const { body } = require("express-validator");
const postController = require("../controllers/postController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { commentRouter } = require("./commentRoutes");

const router = express.Router();

// Nest comment routes: /api/posts/:postId/comments
router.use("/:postId/comments", commentRouter);

router
  .route("/")
  .get(optionalAuth, postController.getAllPosts)
  .post(
    protect,
    restrictTo("author", "editor", "admin"),
    [
      body("name").trim().notEmpty().withMessage("Title is required."),
      body("message").trim().notEmpty().withMessage("Content is required."),
    ],
    validateRequest,
    postController.createPost
  );

router.get("/mine", protect, postController.getMyPosts);
router.get("/analytics/mine", protect, postController.getMyAnalytics);

router
  .route("/:id")
  .get(optionalAuth, postController.getPost)
  .patch(protect, postController.updatePost)
  .delete(protect, postController.deletePost);

router.patch(
  "/:id/status",
  protect,
  restrictTo("editor", "admin"),
  postController.updatePostStatus
);

router.patch("/:id/like", protect, postController.likePost);

module.exports = router;
