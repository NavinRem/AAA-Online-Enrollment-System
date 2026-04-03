const express = require("express");
const router = express.Router();
const categoryController = require("../../controllers/academic/categoryController");
const { verifyToken, isAdmin } = require("../../middleware/authMiddleware");

// Get All Categories
router.get("/", categoryController.getAllCategories);

// Create Category (Admin Only)
router.post("/", verifyToken, isAdmin, categoryController.createCategory);

// Delete Category (Admin Only)
router.delete("/:id", verifyToken, isAdmin, categoryController.deleteCategory);

// Nested Level Routes
router.use("/:categoryId/levels", require("./levels"));

module.exports = router;
