const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Create or Update User
router.post("/", userController.createOrUpdateUser);

// Get All Users
router.get("/", userController.getAllUsers);

// Get User by ID
router.get("/:uid", userController.getUser);

module.exports = router;
