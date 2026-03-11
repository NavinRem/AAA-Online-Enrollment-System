const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const bucket = admin.storage().bucket();

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const blob = bucket.file(`programs/${Date.now()}_${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobStream.on("error", (err) => {
      logger.error("Upload error:", err);
      res.status(500).json({ error: err.message });
    });

    blobStream.on("finish", async () => {
      // Create a publicly accessible URL
      // For real projects, you might use getSignedUrl or make the bucket public
      // Here we will use the standard Firebase Storage URL format
      await blob.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      res.status(200).json({ imageURL: publicUrl });
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    logger.error("Controller error:", error);
    res.status(500).json({ error: error.message });
  }
};
