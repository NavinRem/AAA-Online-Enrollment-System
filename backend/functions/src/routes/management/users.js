const express = require("express");
const router = express.Router();
const userController = require("../../controllers/management/userController");
const { verifyToken, isAdmin, isOwnerOrAdmin } = require("../../middleware/authMiddleware");

// Register Parent Account (Publicly accessible, but role-guarded in service)
router.post("/registerParentAccount", userController.registerParentAccount);

// Register Staff Account (Admin Only)
router.post("/registerStaffAccount", verifyToken, isAdmin, userController.registerStaffAccount);

// Register Student Profile (Owner or Admin)
router.post(
  "/:uid/registerStudentProfile",
  verifyToken,
  isOwnerOrAdmin,
  userController.registerStudentProfile,
);

// Update Medical Info (Admin or Instructor usually, but keeping it Owner/Admin for now)
router.patch("/students/:id/medical", verifyToken, userController.updateMedicalInfo);

// Get All Students (Admin Only)
router.get("/allStudents", verifyToken, isAdmin, userController.getAllStudents);

// Get All Users (Admin Only)
router.get("/", verifyToken, isAdmin, userController.getAllUsers);

// Get User by ID (Owner or Admin)
router.get("/:uid", verifyToken, isOwnerOrAdmin, userController.getUser);

// Update User (Owner or Admin)
router.patch("/:uid", verifyToken, isOwnerOrAdmin, userController.updateUser);

// Delete User (Owner or Admin)
router.delete("/:uid", verifyToken, isOwnerOrAdmin, userController.deleteUser);

// Get All Students for Parent (Owner or Admin)
router.get("/:uid/students", verifyToken, isOwnerOrAdmin, userController.getStudentsByParentID);

// Run Data Standardization and Mirroring Sync (Admin Only)
router.post("/run-standardization", verifyToken, isAdmin, userController.runStandardization);

module.exports = router;
