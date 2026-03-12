const express = require("express");
const router = express.Router();
const userController = require("../../controllers/management/userController");

// Register Parent Account
router.post("/registerParentAccount", userController.registerParentAccount);

// Get User Role
router.get("/:uid/role", userController.getUserRole);

// Register Student Profile
router.post(
  "/:uid/registerStudentProfile",
  userController.registerStudentProfile,
);

// Update Medical Info
router.put("/students/:id/medical", userController.updateMedicalInfo);

// Get All Students (Admin)
router.get("/allStudents", userController.getAllStudents);

// Get All Users
router.get("/", userController.getAllUsers);

// Get User by ID
router.get("/:uid", userController.getUser);

// Update User
router.put("/:uid", userController.updateUser);

// Delete User
router.delete("/:uid", userController.deleteUser);

// Get All Students for Parent
router.get("/:uid/students", userController.getStudentsByParentID);

module.exports = router;
