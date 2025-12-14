const jwt = require("jsonwebtoken");

// In-memory blacklist (simple, works for single server)
const tokenBlacklist = new Set();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  // Check blacklist first
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ message: "Token revoked — please login again" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
};

const authorizeRoles = (...allowedRoles) => {
  // Accept single string or array
  if (!Array.isArray(allowedRoles)) {
    allowedRoles = [allowedRoles];
  }

  return (req, res, next) => {
    if (!req.user || typeof req.user.role !== "string") {
      return res.status(403).json({ message: "Forbidden: invalid or missing role" });
    }

    const userRole = req.user.role.trim().toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => String(r).trim().toLowerCase());

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }

    next();
  };
};

// Export blacklist so logout can use it
module.exports = { authenticateToken, authorizeRoles, tokenBlacklist };