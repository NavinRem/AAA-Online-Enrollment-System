const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Register Parent Account (was createUser)
router.post("/registerParentAccount", userController.registerParentAccount);

// Get User Role
router.get("/:uid/role", userController.getUserRole);

// Register Student Profile (was addStudent)
router.post(
  "/:uid/registerStudentProfile",
  userController.registerStudentProfile,
);

// Update Medical Info
router.put("/students/:id/medical", userController.updateMedicalInfo);

// --- Legacy / Utility Routes ---

// Seed script (temp)
router.get("/seed", userController.seedData);

// Get All Students (Admin)
router.get("/allStudents", userController.getAllStudents);

// Get All Users
router.get("/", userController.getAllUsers);

// Get User by ID
router.get("/:uid", userController.getUser);

// Get All Students for Parent
router.get("/:uid/students", userController.getStudentsByParentID);

module.exports = router;
