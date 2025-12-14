// soap/soapService.js
const Role = require('../models/Role');

/**
 * SOAP service object exactly uses operation names from WSDL
 * Each fn receives args and returns a Promise / object.
 */
const RoleService = {
  RoleService: {
    RolePort: {
      async GetRole(args, cb) {
        try {
          const id = args.id;
          const role = await Role.findById(id).lean();
          return { role: role || null };
        } catch (err) {
          return { role: null };
        }
      },

      async ListRoles(args, cb) {
        const roles = await Role.find().lean();
        return { roles };
      },

      async CreateRole(args, cb) {
        try {
          const r = new Role({
            name: args.name,
            description: args.description || '',
            permissions: args.permissions ? (Array.isArray(args.permissions) ? args.permissions : [args.permissions]) : []
          });
          await r.save();
          return { role: r.toObject() };
        } catch (err) {
          return { role: null };
        }
      },

      async UpdateRole(args, cb) {
        try {
          const id = args.id;
          const update = {};
          if (args.name) update.name = args.name;
          if (args.description) update.description = args.description;
          if (args.permissions) update.permissions = Array.isArray(args.permissions) ? args.permissions : [args.permissions];
          const role = await Role.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
          return { role: role || null };
        } catch (err) {
          return { role: null };
        }
      },

      async DeleteRole(args, cb) {
        try {
          const id = args.id;
          const role = await Role.findByIdAndDelete(id);
          return { success: !!role };
        } catch (err) {
          return { success: false };
        }
      }
    }
  }
};

module.exports = RoleService;
