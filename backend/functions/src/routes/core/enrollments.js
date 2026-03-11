const express = require("express");
const router = express.Router();
const enrollmentController = require("../../controllers/core/enrollmentController");

// Create Enrollment
router.post("/createEnrollment", enrollmentController.createEnrollment);

// Check Eligibility
router.get(
  "/eligibility/:studentId/:courseId",
  enrollmentController.getStudentEligibility,
);

// Legacy (redirect/match previous direct root POST)
router.post("/", enrollmentController.createEnrollment);

// Get all enrollments
router.get("/", enrollmentController.getAllEnrollments);

// Get a single enrollment
router.get("/:id", enrollmentController.getEnrollment);

// Cancel Enrollment
router.post("/cancel", enrollmentController.cancelEnrollment);

// Update Enrollment properties
router.patch("/:id", enrollmentController.updateEnrollment);

// Permanently Delete Enrollment
router.delete("/:id", enrollmentController.deleteEnrollment);

module.exports = router;
