const express = require("express");
const router = express.Router();
const progressController = require("../../controllers/tracking/progressController");

router.get("/:id", progressController.getStudentProgress);

module.exports = router;
