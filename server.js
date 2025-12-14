// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const http = require('http');
const soap = require('soap');
const rolesRouter = require('./routes/roles');
const RoleService = require('./soap/soapService');
const wsdlXml = fs.readFileSync(__dirname + '/soap/roles.wsdl', 'utf8');
//const { jwtSecret } = require('./middleware/auth');
const jwt = require('jsonwebtoken');
const connectWithRetry = require("./config/db");
//const authenticateToken = require('./middleware/auth');
//const { authenticateToken, authorizeRoles } = require("./middleware/auth");
const router = express.Router();
const { authenticateToken, authorizeRoles } = require("./middleware/auth");
//const RoleController = require("./controllers/roleController");
const auth = require("./middleware/auth");
const app = express();
const userMediaRoutes = require('./routes/userMediaRoutes');
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rolesdb';
const roleRoutes = require("./routes/roleRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const User = require('./models/User');   // ← ADD THIS LINE

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => { console.error('Mongo connect error', err); process.exit(1); });
 

// REST api
app.use('/api/user-media', userMediaRoutes);
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));
app.use('/api/roles', rolesRouter);
app.get('/', (req,res) => res.send('Role CRUD REST + SOAP API is running'));

// after app created & middlewares
app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);
app.use('/api/auth', authRoutes);

// ADD THIS NEW PROTECTED ROUTE HERE for HOME Page
app.get('/home', authenticateToken, (req, res) => {
  res.json({
    message: "Welcome to the protected home page!",
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      username: req.user.username //|| "N/A"
    },
    tip: "You are successfully authenticated as " + req.user.role + "!"
  });
});


// GET current logged-in user's profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Your profile",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        imageUrl: user.image 
          ? `http://localhost:3000/api/user-media/image/${user._id}` 
          : null,
        videoUrl: user.video 
          ? `http://localhost:3000/api/user-media/video/${user._id}` 
          : null,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// Connect to MongoDB with retry + pooling
connectWithRetry();


// TEMPORARY DEBUG ROUTE – delete later
app.get("/debug-token", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, decoded });
  } catch (err) {
    res.status(401).json({ valid: false, error: err.message });
  }
});

// example protected route
app.get('/protected', authenticateToken, (req,res) => {
  res.json({ message: 'You are in', user: req.user });
}); 

// GET user profile by ID — protected route
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;

    // Find the user (exclude password from response)
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optional: allow only admin to view any profile, or users to view their own
    const isAdmin = req.user.role === 'admin';
    const isOwnProfile = req.user.id === userId;

    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({ message: "Forbidden: You can only view your own profile" });
    }

    res.json({
      message: "User profile retrieved successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// Create HTTP server and attach SOAP server to it
const server = http.createServer(app);

// Attach SOAP service at /soap
soap.listen(server, '/soap', RoleService, wsdlXml);

// Start
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`WSDL available at http://localhost:${PORT}/soap?wsdl`);
  console.log("JWT_SECRET loaded:", process.env.JWT_SECRET);
});
