const express = require("express");
const router = express.Router();
const programController = require("../../controllers/academic/programController");
const sessionController = require("../../controllers/academic/sessionController");
const { verifyToken, isAdmin } = require("../../middleware/authMiddleware");

// Create Program (Admin only)
router.post("/", verifyToken, isAdmin, programController.createProgram);

// Get All Programs
router.get("/", programController.getAllPrograms);

// Get Sessions for a Program (getAvailableSessions)
router.get("/:id/sessions", sessionController.getAvailableSessions);

// Alias or specific endpoint if client requests "/getAvailableSessions"
router.get("/:id/getAvailableSessions", sessionController.getAvailableSessions);

// Get Single Program
router.get("/:id", programController.getProgram);

// Update/Delete (Manage) (Admin Only)
router.patch("/:id", verifyToken, isAdmin, programController.updateProgram);
router.delete("/:id", verifyToken, isAdmin, programController.deleteProgram);

module.exports = router;
