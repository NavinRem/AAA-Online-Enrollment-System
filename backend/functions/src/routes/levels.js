const express = require("express");
const router = express.Router({ mergeParams: true });
const levelController = require("../controllers/levelController");

router.get("/", levelController.getAllLevels);
router.post("/", levelController.createLevel);
router.delete("/:id", levelController.deleteLevel);

module.exports = router;
