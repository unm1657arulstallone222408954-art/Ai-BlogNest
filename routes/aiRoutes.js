const express = require("express");
const { body } = require("express-validator");
const aiController = require("../controllers/aiController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");
const { aiLimiter } = require("../middleware/rateLimiter");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.post(
  "/generate-blog",
  aiLimiter,
  protect,
  restrictTo("author", "editor", "admin"),
  [body("topic").trim().notEmpty().withMessage("A topic is required.")],
  validateRequest,
  aiController.generateBlog
);

router.post(
  "/summarize",
  aiLimiter,
  protect,
  aiController.summarize
);

router.post(
  "/faq",
  aiLimiter,
  optionalAuth,
  [body("question").trim().notEmpty().withMessage("A question is required.")],
  validateRequest,
  aiController.faq
);

module.exports = router;
