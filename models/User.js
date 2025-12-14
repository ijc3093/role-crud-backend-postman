// models/User.js
const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date } // optional for cleanup
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // hashed password
  role:     { type: String, enum: ['admin','manager','user'], default: 'user' },
  image: {
    type: String, // stores fileId from GridFS
    default: null
  },
  video: {
    type: String, // stores fileId from GridFS
    default: null
  },
  refreshTokens: [RefreshTokenSchema],
}, 
{ timestamps: true });

// optional: helper to remove expired refresh tokens
UserSchema.methods.removeExpiredRefreshTokens = function() {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter(t => !t.expiresAt || t.expiresAt > now);
};

module.exports = mongoose.model('User', UserSchema);
