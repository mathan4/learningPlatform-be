const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../utils/config');
const User = require('../models/userModel');

const auth = {
  verifyToken: async (req, res, next) => {
    try {
      let token = req.cookies.token;

      // If not in cookies, try Authorization header
      if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        } else {
          token = authHeader; // fallback for token without Bearer
        }
      }

      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      // verify the token
      const decoded = jwt.verify(token, JWT_SECRET);

      if (!decoded || !decoded.id) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      req.userId = decoded.id; // Make sure your token uses `.id` not `._id`

      next();
    } catch (error) {
      console.error("verifyToken error:", error.message);
      return res.status(401).json({ message: 'Unauthorized' });
    }
  },

  allowRoles: (roles) => {
    return async (req, res, next) => {
      try {
        if (!req.userId) {
          return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await User.findById(req.userId);

        if (!user) {
          return res.status(401).json({ message: 'Unauthorized - user not found' });
        }

        if (!roles.includes(user.role)) {
          return res.status(403).json({ message: 'Forbidden - insufficient role' });
        }

        req.user = user; // optionally attach full user object
        next();
      } catch (error) {
        console.error("allowRoles error:", error.message);
        return res.status(403).json({ message: 'Forbidden' });
      }
    };
  }
};

module.exports = auth;
