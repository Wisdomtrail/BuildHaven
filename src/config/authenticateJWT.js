const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin'); // Update the path to your Admin model

const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Extract token

    try {
      // Decode the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user (optional, for extra validation)
      const admin = await Admin.findById(decoded.id);
      if (!admin) {
        return res.status(403).json({ message: 'Admin not found' });
      }

      req.user = {
        id: admin._id,
        isAdmin: admin.role === 'admin' || admin.role === 'superadmin', // Check role
      };

      return next();
    } catch (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
  } else {
    return res.status(401).json({ message: 'Authorization header is missing' });
  }
};

module.exports = authenticateJWT;
