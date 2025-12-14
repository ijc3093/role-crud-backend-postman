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
    res.status(500).json({ message: "Server error" });
  }
});