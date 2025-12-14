// models/Role.js
const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, 
  unique: true, 
  // enum: ['admin','manager','user'] 
},
  description: { type: String },
  permissions: { type: [String], 
  default: [] }, // optional permission list
}, 
{ timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);
