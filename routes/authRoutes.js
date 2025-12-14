const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

//const nodemailer = require('nodemailer');
// Auto-create Ethereal test account
let transporter;
//const tokenBlacklist = new Set();
const { authenticateToken, tokenBlacklist } = require("../middleware/auth"); // ← add tokenBlacklist here
const nodemailer = require('nodemailer');

// Register a new user
router.post("/register", async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Check required fields
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Check if user exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            role: role || "user", // default role
        });

        await user.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({ message: "Missing email or password" });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        // Check password
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ message: "Invalid credentials" });

        // Create JWT
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                email: user.email,
                username: user.username,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                username: user.username,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Logout – adds token to blacklist (optional but clean)
router.post("/logout", authenticateToken, (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) tokenBlacklist.add(token);
  res.json({ message: "Logged out successfully" });
});


(async () => {
  const testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,  // e.g., xxxxx@ethereal.email
      pass: testAccount.pass   // random password
    }
  });

  console.log('Ethereal test account ready:');
  console.log('User:', testAccount.user);
  console.log('Pass:', testAccount.pass);
})();

// FORGOT PASSWORD - Send reset link
// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

  const mailOptions = {
    from: 'no-reply@yourapp.com',
    to: email,
    subject: 'Password Reset',
    text: `Click to reset: ${resetUrl}\nExpires in 1 hour.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ message: "Email failed" });
    }
    const preview = nodemailer.getTestMessageUrl(info);
    console.log("Preview URL:", preview);
    res.json({ message: "Reset link sent (check console for preview)", previewUrl: preview });
  });
});

// RESET PASSWORD - Set new password
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) return res.status(400).json({ message: "New password required" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});


// CHANGE PASSWORD - Logged-in user
router.post("/change-password", authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Both passwords required" });
  }

  const user = await User.findById(req.user.id);

  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) {
    return res.status(400).json({ message: "Old password incorrect" });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await user.save();

  res.json({ message: "Password changed successfully" });
});

module.exports = router;
