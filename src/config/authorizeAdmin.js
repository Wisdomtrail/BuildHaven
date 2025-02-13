module.exports = function authorizeAdmin(req, res, next) {
    if (req.user && req.user.isAdmin) {
      return next(); // Allow access
    }
    return res.status(403).json({ message: 'Access denied: Admins only' });
  };
  