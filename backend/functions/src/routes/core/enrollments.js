const express = require("express");
const router = express.Router();
const enrollmentController = require("../../controllers/core/enrollmentController");
const { verifyToken, isAdmin } = require("../../middleware/authMiddleware");

// All enrollment routes require authentication
router.use(verifyToken);

// Create Enrollment
router.post("/createEnrollment", enrollmentController.createEnrollment);

// Check Eligibility
router.get(
  "/eligibility/:studentId/:programId",
  enrollmentController.getStudentEligibility,
);

// Legacy (redirect/match previous direct root POST)
router.post("/", enrollmentController.createEnrollment);

// Get all enrollments (Admin Only)
router.get("/", isAdmin, enrollmentController.getAllEnrollments);

// Get a single enrollment
router.get("/:id", enrollmentController.getEnrollment);

// Cancel Enrollment
router.post("/:id/cancel", enrollmentController.cancelEnrollment);

// Update Enrollment properties (Admin Only usually, or restricted)
router.patch("/:id", isAdmin, enrollmentController.updateEnrollment);

// Permanently Delete Enrollment (Admin Only)
router.delete("/:id", isAdmin, enrollmentController.deleteEnrollment);

module.exports = router;
