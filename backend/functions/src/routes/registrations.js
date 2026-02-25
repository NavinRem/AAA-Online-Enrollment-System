const express = require("express");
const router = express.Router();
const registrationController = require("../controllers/registrationController");

// Create Enrollment (was createRegistration)
router.post("/createEnrollment", registrationController.createEnrollment);

// Check Eligibility
router.get(
  "/eligibility/:studentId/:courseId",
  registrationController.getStudentEligibility,
);

// Legacy
router.post("/", registrationController.createEnrollment);

// Get all registrations
router.get("/", registrationController.getAllRegistrations);

// Get a single registration
router.get("/:id", registrationController.getRegistration);

// Cancel Registration
router.post("/cancel", registrationController.cancelRegistration);

module.exports = router;
