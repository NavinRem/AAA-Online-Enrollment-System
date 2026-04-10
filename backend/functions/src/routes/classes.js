const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Bulk Operations
router.post("/duplicate", verifyToken, isAdmin, classController.duplicateClasses);

// CRUD
router.post("/", verifyToken, isAdmin, classController.createClass);
router.get("/", verifyToken, classController.getAllClasses);
router.get("/:id", verifyToken, classController.getClass);
router.patch("/:id", verifyToken, isAdmin, classController.updateClass);
router.delete("/:id", verifyToken, isAdmin, classController.deleteClass);

// Syncing
router.post("/:id/sync", verifyToken, isAdmin, classController.syncCount);

module.exports = router;
