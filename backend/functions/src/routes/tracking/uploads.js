const express = require("express");
const router = express.Router();
const multer = require("multer");
const uploadController = require("../../controllers/tracking/uploadController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

router.post("/", upload.single("image"), uploadController.uploadImage);

module.exports = router;
