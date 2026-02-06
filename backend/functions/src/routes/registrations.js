const express = require("express");
const router = express.Router();
const registrationController = require("../controllers/registrationController");

// Create a new registration
router.post("/", registrationController.createRegistration);

// Get all registrations
router.get("/", registrationController.getAllRegistrations);

// Get a single registration
router.get("/:id", registrationController.getRegistration);

module.exports = router;
