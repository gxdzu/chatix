const rateLimit = require('express-rate-limit');
exports.authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many attempts' } });
exports.apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 200, message: { error: 'Rate limit exceeded' } });
