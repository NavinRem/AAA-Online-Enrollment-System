const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

// Get All Categories
router.get("/", categoryController.getAllCategories);

// Create Category
router.post("/", categoryController.createCategory);

// Delete Category
router.delete("/:id", categoryController.deleteCategory);

// Nested Level Routes
router.use("/:categoryId/levels", require("./levels"));

module.exports = router;
