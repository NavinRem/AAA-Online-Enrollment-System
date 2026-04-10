const express = require("express");
const router = express.Router();
const programController = require("../controllers/programController");
const sessionController = require("../controllers/sessionController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Create Program (Admin only)
router.post("/", verifyToken, isAdmin, programController.createProgram);

// Get All Programs
router.get("/", verifyToken, programController.getAllPrograms);

// Get Sessions for a Program (getAvailableSessions)
router.get("/:id/sessions", verifyToken, sessionController.getAvailableSessions);

// Alias or specific endpoint if client requests "/getAvailableSessions"
router.get("/:id/getAvailableSessions", verifyToken, sessionController.getAvailableSessions);

// Get Single Program
router.get("/:id", verifyToken, programController.getProgram);

// Update/Delete (Manage) (Admin Only)
router.patch("/:id", verifyToken, isAdmin, programController.updateProgram);
router.delete("/:id", verifyToken, isAdmin, programController.deleteProgram);

// Schedule Management
router.post("/:id/schedules", verifyToken, isAdmin, programController.addSchedule);
router.get("/:id/schedules", verifyToken, programController.getSchedules);
router.delete("/:id/schedules/:scheduleId", verifyToken, isAdmin, programController.removeSchedule);


module.exports = router;
