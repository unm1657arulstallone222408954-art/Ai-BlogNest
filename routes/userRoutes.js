const express = require("express");
const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, restrictTo("admin"));

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);
router.patch("/:id/role", userController.updateUserRole);
router.patch("/:id/deactivate", userController.setUserActiveStatus);
router.delete("/:id", userController.deleteUser);

module.exports = router;
