const express = require("express");
const router = express.Router();
const programController = require("../../controllers/academic/programController");
const sessionController = require("../../controllers/academic/sessionController");

// Create Program (Admin only ideally, but public for now)
router.post("/", programController.createProgram);

// Get All Programs
router.get("/", programController.getAllPrograms);

// Get Sessions for a Program (getAvailableSessions)
router.get("/:id/sessions", sessionController.getAvailableSessions);

// Alias or specific endpoint if client requests "/getAvailableSessions"
router.get("/:id/getAvailableSessions", sessionController.getAvailableSessions);

// Get Single Program
router.get("/:id", programController.getProgram);

// Update/Delete (Manage)
router.patch("/:id", programController.updateProgram);
router.delete("/:id", programController.deleteProgram);

module.exports = router;
