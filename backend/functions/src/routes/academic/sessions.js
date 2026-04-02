const express = require("express");
const router = express.Router();
const sessionController = require("../../controllers/academic/sessionController");

// Create Session
router.post("/", sessionController.createSession);

// Get All Sessions
router.get("/", sessionController.getAllSessions);

// Validate Capacity
router.get("/:id/validateCapacity", sessionController.validateCapacity);

// Get Session by ID
router.get("/:id", sessionController.getSession);

// Teacher Management
router.patch("/:id/teacher", sessionController.assignTeacher);
router.get("/:id/teachers", sessionController.getSessionTeachers);
router.post("/sync-counts", sessionController.syncStudentCounts);
router.post("/sync-all", sessionController.syncAllSessions);

module.exports = router;
