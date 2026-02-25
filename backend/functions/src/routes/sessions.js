const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");

// Create Session
router.post("/", sessionController.createSession);

// Validate Capacity
router.get("/:id/validateCapacity", sessionController.validateCapacity);

// Get Session by ID
router.get("/:id", sessionController.getSession);

// Instructor Management
router.put("/:id/instructor", sessionController.assignInstructor);
router.get("/:id/roster", sessionController.getInstructorRoster);
router.post("/sync-counts", sessionController.syncStudentCounts);

module.exports = router;
