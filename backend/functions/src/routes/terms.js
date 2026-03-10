const express = require("express");
const router = express.Router();
const termController = require("../controllers/termController");

router.get("/", termController.getAllTerms);
router.post("/", termController.createTerm);
router.delete("/:id", termController.deleteTerm);

module.exports = router;
