const express = require("express");
const router = express.Router();
const progressController = require("../../controllers/tracking/progressController");
const { verifyToken } = require("../../middleware/authMiddleware");

router.get("/:id", verifyToken, progressController.getStudentProgress);

module.exports = router;
