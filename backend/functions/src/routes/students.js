const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");

// Create Student
router.post("/", studentController.createStudent);

// Get Student by ID
router.get("/:id", studentController.getStudent);

// Update Student (General)
router.put("/:id", studentController.updateStudent);

// Update Medical Info (Specific)
router.put("/:id/medical", studentController.updateMedicalInfo);

// Get Students by Parent ID
router.get("/parent/:parentId", studentController.getStudentsByParent);

// Get ALL Students
router.get("/", studentController.getAllStudents);

module.exports = router;
