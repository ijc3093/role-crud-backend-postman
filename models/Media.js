// models/Media.js
const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  length: Number,
  uploadDate: { type: Date, default: Date.now },
  metadata: {   // optional: add tags, description, uploadedBy user ID
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: String
  }
});

module.exports = mongoose.model('Media', mediaSchema);