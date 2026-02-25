const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const sessionController = require("../controllers/sessionController");

// Create Course (Admin only ideally, but public for now)
router.post("/", courseController.createCourse);

// Get All Courses
router.get("/", courseController.getAllCourses);

// Get Sessions for a Course (getAvailableSessions)
router.get("/:id/sessions", sessionController.getAvailableSessions);

// Alias or specific endpoint if client requests "/getAvailableSessions"
router.get("/:id/getAvailableSessions", sessionController.getAvailableSessions);

// Get Single Course
router.get("/:id", courseController.getCourse);

// Update/Delete (Manage)
router.put("/:id", courseController.updateCourse);
router.delete("/:id", courseController.deleteCourse);

module.exports = router;
