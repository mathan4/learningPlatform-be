const rateLimit = require('express-rate-limit');

// General purpose limiter: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    message: 'Too many requests from this IP, please try again later.',
  },
});

// More strict limiter for login & auth routes
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    message: 'Too many login attempts, please try again in 5 minutes.',
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
};
