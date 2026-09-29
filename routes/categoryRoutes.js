const express = require("express");
const { body } = require("express-validator");
const categoryController = require("../controllers/categoryController");
const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router
  .route("/")
  .get(categoryController.getAllCategories)
  .post(
    protect,
    restrictTo("editor", "admin"),
    [body("name").trim().notEmpty().withMessage("Category name is required.")],
    validateRequest,
    categoryController.createCategory
  );

router
  .route("/:id")
  .get(categoryController.getCategory)
  .patch(protect, restrictTo("editor", "admin"), categoryController.updateCategory)
  .delete(protect, restrictTo("editor", "admin"), categoryController.deleteCategory);

module.exports = router;
