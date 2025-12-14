const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const Role = require("../models/Role");

// Create Role (admin only)
router.post("/", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const role = new Role({ name: req.body.name });
        await role.save();
        res.status(201).json(role);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Roles (admin, manager)
router.get("/", authenticateToken, authorizeRoles("admin", "manager"), async (req, res) => {
    try {
        const roles = await Role.find();
        res.json(roles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Role (admin)
router.delete("/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const role = await Role.findByIdAndDelete(req.params.id);
        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }
        res.json({ message: "Role deleted successfully", deletedRole: role.name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Get All Roles + Search (admin, manager)
router.get("/", authenticateToken, authorizeRoles("admin", "manager"), async (req, res) => {
  try {
    const { name } = req.query;
    const query = name ? { name: new RegExp(name, "i") } : {}; // case-insensitive search

    const roles = await Role.find(query).sort({ createdAt: -1 });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Pagination (very professional)
router.get("/", authenticateToken, authorizeRoles("admin", "manager"), async (req, res) => {
  try {
    const { name, page = 1, limit = 10 } = req.query;
    const query = name ? { name: new RegExp(name, "i") } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const roles = await Role.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Role.countDocuments(query);

    res.json({
      roles,
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//One-liner: Add both search + pagination together
router.get("/", authenticateToken, authorizeRoles("admin", "manager"), async (req, res) => {
  try {
    const { name, page = 1, limit = 10 } = req.query;
    const query = name ? { name: new RegExp(name, "i") } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const roles = await Role.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Role.countDocuments(query);

    res.json({
      roles,
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// UPDATE Role – only admin can do this
// router.put("/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => {
//     try {
//         const { name, description, permissions } = req.body;

//         // Prevent duplicate role name
//         if (name) {
//             const existing = await Role.findOne({ name, _id: { $ne: req.params.id } });
//             if (existing) {
//                 return res.status(400).json({ message: "Role name already exists" });
//             }
//         }

//         const updatedRole = await Role.findByIdAndUpdate(
//             req.params.id,
//             { name, description, permissions },
//             { new: true, runValidators: true }
//         );

//         if (!updatedRole) {
//             return res.status(404).json({ message: "Role not found" });
//         }

//         res.json({
//             message: "Role updated successfully",
//             role: updatedRole
//         });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });


router.put("/:id", authenticateToken, (req, res, next) => {
  console.log("DEBUG: User role is:", req.user.role);
  console.log("DEBUG: Allowed roles passed to middleware: 'admin'");

  // Temporarily bypass authorization
  next();
}, async (req, res) => {
  // Your existing update code here
  try {
    const { name, description, permissions } = req.body;

    const updatedRole = await Role.findByIdAndUpdate(
      req.params.id,
      { name, description, permissions },
      { new: true, runValidators: true }
    );

    if (!updatedRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json({
      message: "Role updated successfully (debug mode)",
      role: updatedRole
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
