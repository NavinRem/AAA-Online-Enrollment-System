const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Create Session (Admin Only)
router.post("/", verifyToken, isAdmin, sessionController.createSession);

// Get All Sessions
router.get("/", verifyToken, sessionController.getAllSessions);

// Validate Capacity
router.get("/:id/validateCapacity", verifyToken, sessionController.validateCapacity);

// Get Session by ID
router.get("/:id", verifyToken, sessionController.getSession);

// Teacher Management (Admin Only)
router.patch(
  "/:id/teacher",
  verifyToken,
  isAdmin,
  sessionController.assignTeacher,
);
router.get("/:id/teachers", verifyToken, sessionController.getSessionTeachers);
router.post(
  "/sync-counts",
  verifyToken,
  isAdmin,
  sessionController.syncStudentCounts,
);
router.post(
  "/sync-all",
  verifyToken,
  isAdmin,
  sessionController.syncAllSessions,
);

module.exports = router;
