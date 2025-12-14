// routes/userMediaRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// GridFS Bucket (same as before)
let gfsBucket;
mongoose.connection.once('open', () => {
  gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'user_media'
  });
});

const upload = multer({ storage: multer.memoryStorage() });

// Upload Profile Image (user can update own, admin can update any)
router.post('/image', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

  const userId = req.user.id; // current logged-in user

  const uploadStream = gfsBucket.openUploadStream('profile_image_' + userId, {
    contentType: req.file.mimetype
  });

  uploadStream.end(req.file.buffer);

  uploadStream.on('finish', async () => {
    await User.findByIdAndUpdate(userId, { image: uploadStream.id.toString() });
    res.json({
      message: 'Profile image uploaded',
      imageId: uploadStream.id,
      viewUrl: `http://localhost:3000/api/user-media/image/${userId}`
    });
  });

  uploadStream.on('error', () => res.status(500).json({ message: 'Upload failed' }));
});

// Upload Profile Video
router.post('/video', authenticateToken, upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No video uploaded' });

  const userId = req.user.id;

  const uploadStream = gfsBucket.openUploadStream('profile_video_' + userId, {
    contentType: req.file.mimetype
  });

  uploadStream.end(req.file.buffer);

  uploadStream.on('finish', async () => {
    await User.findByIdAndUpdate(userId, { video: uploadStream.id.toString() });
    res.json({
      message: 'Profile video uploaded',
      videoId: uploadStream.id,
      viewUrl: `http://localhost:3000/api/user-media/video/${userId}`
    });
  });
});

// View Profile Image
router.get('/image/:userId', authenticateToken, (req, res) => {
  User.findById(req.params.userId).then(user => {
    if (!user || !user.image) return res.status(404).json({ message: 'Image not found' });

    const fileId = new mongoose.Types.ObjectId(user.image);
    gfsBucket.openDownloadStream(fileId).pipe(res);
  });
});

// View Profile Video
router.get('/video/:userId', authenticateToken, (req, res) => {
  User.findById(req.params.userId).then(user => {
    if (!user || !user.video) return res.status(404).json({ message: 'Video not found' });

    res.set('Content-Type', 'video/mp4'); // adjust if needed
    const fileId = new mongoose.Types.ObjectId(user.video);
    gfsBucket.openDownloadStream(fileId).pipe(res);
  });
});

module.exports = router;