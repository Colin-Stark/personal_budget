const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = async function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
    const token = auth.slice(7);
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) return res.status(500).json({ message: 'Server misconfiguration' });
        const payload = jwt.verify(token, secret);
        const user = await User.findById(payload.sub).exec();
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};
