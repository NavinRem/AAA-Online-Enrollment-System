const express = require("express");
const router = express.Router();
const trialController = require("../controllers/trialController");

router.post("/", trialController.createTrial);
router.get("/", trialController.getAllTrials);
router.get("/:id", trialController.getTrial);
router.patch("/:id", trialController.updateTrial);
router.delete("/:id", trialController.deleteTrial);

module.exports = router;
