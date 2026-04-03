const express = require("express");
const router = express.Router();
const termController = require("../../controllers/academic/termController");
const { verifyToken, isAdmin } = require("../../middleware/authMiddleware");

router.get("/", termController.getAllTerms);
router.post("/", verifyToken, isAdmin, termController.createTerm);
router.delete("/:id", verifyToken, isAdmin, termController.deleteTerm);

module.exports = router;
