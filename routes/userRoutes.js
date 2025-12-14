const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const User = require("../models/User");

// Get all users (admin only)
router.get("/", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single user (admin or the user themselves)
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.id !== req.params.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update user (admin or the user)
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.id !== req.params.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        }).select("-password");

        if (!updated) return res.status(404).json({ message: "User not found" });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete user (admin only)
router.delete("/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const removed = await User.findByIdAndDelete(req.params.id);
        if (!removed) return res.status(404).json({ message: "User not found" });

        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
