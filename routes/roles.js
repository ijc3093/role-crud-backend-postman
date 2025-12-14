// routes/roles.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/roleController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Public read endpoints optionally (here we protect them requiring authentication)
router.get('/', authenticateToken, ctrl.listRoles);
router.get('/:id', authenticateToken, ctrl.getRole);

// Only admin can create or delete roles; managers can update
router.post('/', authenticateToken, authorizeRoles('admin'), ctrl.createRole);
router.put('/:id', authenticateToken, authorizeRoles(['admin','manager']), ctrl.updateRole);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), ctrl.deleteRole);

module.exports = router;
