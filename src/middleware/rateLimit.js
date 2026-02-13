const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { authLimiter };
