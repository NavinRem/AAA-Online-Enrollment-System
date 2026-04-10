const express = require("express");
const router = express.Router();
const multer = require("multer");
const uploadController = require("../controllers/uploadController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, upload.single("image"), uploadController.uploadImage);

module.exports = router;
