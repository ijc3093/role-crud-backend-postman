// controllers/roleController.js
const Role = require('../models/Role');

async function listRoles(req, res) {
  const roles = await Role.find().lean();
  res.json(roles);
}

const getAllRoles = async (req, res) => {
  res.json({ message: "All roles" });
};

const createRolemessage = async (req, res) => {
  res.json({ message: "Role created" });
};

async function getRole(req, res) {
  const id = req.params.id;
  const role = await Role.findById(id);
  if (!role) return res.status(404).json({ message: 'Role not found' });
  res.json(role);
}

async function createRole(req, res) {
  const { name, description, permissions } = req.body;
  try {
    const role = new Role({ name, description, permissions });
    await role.save();
    res.status(201).json(role);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function updateRole(req, res) {
  const id = req.params.id;
  const { name, description, permissions } = req.body;
  try {
    const role = await Role.findByIdAndUpdate(id, { name, description, permissions }, { new: true, runValidators: true });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json(role);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function deleteRole(req, res) {
  const id = req.params.id;
  const role = await Role.findByIdAndDelete(id);
  if (!role) return res.status(404).json({ message: 'Role not found' });
  res.json({ message: 'Deleted', role });
}

module.exports = { 
  getAllRoles,
  createRolemessage,
  listRoles, 
  getRole, 
  createRole, 
  updateRole, 
  deleteRole 
};
