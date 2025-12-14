// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const PASSWORD_SALT_ROUNDS = parseInt(process.env.PASSWORD_SALT_ROUNDS || '12');

// helpers
function signAccessToken(user) {
  // include minimal claims
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, username: user.username },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );
}

function generateRefreshToken() {
  // cryptographically random token (store hash in DB)
  return crypto.randomBytes(64).toString('hex'); // 128 hex chars
}
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// POST /auth/register
async function register(req, res) {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    // TODO: validate email format and password strength (use express-validator or Joi)

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) return res.status(409).json({ message: 'Username or email already in use' });

    const salt = await bcrypt.genSalt(PASSWORD_SALT_ROUNDS);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ username, email, password: hashed, role: role || 'user' });
    // Do not return password
    res.status(201).json({ id: user._id, username: user.username, email: user.email, role: user.role });
  } catch (err) {
    console.error('Register error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /auth/login
async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Missing username or password' });

    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    // Issue access token
    const accessToken = signAccessToken(user);

    // Create refresh token (random string), store hashed
    const refreshToken = generateRefreshToken();
    const refreshHash = hashToken(refreshToken);

    // expiry date for refresh token (optional)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    // Save hashed token in user document (push)
    user.refreshTokens.push({ tokenHash: refreshHash, expiresAt });
    user.removeExpiredRefreshTokens();
    await user.save();

    // Return tokens (send refresh token as HttpOnly cookie in production)
    // For simple API we return it in body; for production, send as secure, httpOnly cookie and not in JSON
    res.json({ accessToken, refreshToken, tokenType: 'Bearer', expiresIn: ACCESS_EXPIRES });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /auth/refresh
async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Missing refresh token' });

    const refreshHash = hashToken(refreshToken);
    // find user with this refresh token
    const user = await User.findOne({ 'refreshTokens.tokenHash': refreshHash });
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });

    // Optionally check expiry stored in DB
    const tokenEntry = user.refreshTokens.find(t => t.tokenHash === refreshHash);
    if (tokenEntry && tokenEntry.expiresAt && tokenEntry.expiresAt < new Date()) {
      // remove expired
      user.refreshTokens = user.refreshTokens.filter(t => t.tokenHash !== refreshHash);
      await user.save();
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    // Rotate refresh token: remove the used one and create a new one
    user.refreshTokens = user.refreshTokens.filter(t => t.tokenHash !== refreshHash);

    const newRefresh = generateRefreshToken();
    const newHash = hashToken(newRefresh);
    const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 30);

    user.refreshTokens.push({ tokenHash: newHash, expiresAt });
    user.removeExpiredRefreshTokens();
    await user.save();

    const accessToken = signAccessToken(user);
    res.json({ accessToken, refreshToken: newRefresh, expiresIn: ACCESS_EXPIRES });
  } catch (err) {
    console.error('Refresh error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /auth/logout
async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Missing refresh token' });

    const refreshHash = hashToken(refreshToken);
    // remove refresh token from any user who has it
    await User.updateOne(
      { 'refreshTokens.tokenHash': refreshHash },
      { $pull: { refreshTokens: { tokenHash: refreshHash } } }
    );
    // instruct client to remove cookie if using cookies
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { register, login, refresh, logout };
