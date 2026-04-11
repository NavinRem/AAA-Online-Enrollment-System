const admin = require('firebase-admin')
const logger = require('firebase-functions/logger')

exports.uploadImage = async (req, res) => {
  try {
    const bucket = admin.storage().bucket()
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const blob = bucket.file(`programs/${Date.now()}_${req.file.originalname}`)
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    })

    blobStream.on('error', (err) => {
      logger.error('Upload error:', err)
      res.status(500).json({ error: err.message })
    })

    blobStream.on('finish', async () => {
      await blob.makePublic()
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      res.status(200).json({ imageURL: publicUrl })
    })

    blobStream.end(req.file.buffer)
  } catch (error) {
    logger.error('Controller error:', error)
    res.status(500).json({ error: error.message })
  }
}
