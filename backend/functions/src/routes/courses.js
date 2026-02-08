const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");

// Create Course (Admin only ideally, but public for now)
router.post("/", courseController.createCourse);

// Get All Courses
router.get("/", courseController.getAllCourses);

// Get Single Course
router.get("/:id", courseController.getCourse);

module.exports = router;
