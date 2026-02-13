const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');

function makeAccessToken(user) {
    const key = process.env.JWT_SECRET;
    if (!key) throw new Error('JWT_SECRET is not configured');
    return jwt.sign({ sub: user._id }, key, { expiresIn: '15m' });
}

function makeRefreshPlain(userId) {
    const rand = crypto.randomBytes(32).toString('hex');
    return `${userId.toString()}:${rand}`;
}

async function register({ email, password, displayName }) {
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ email, displayName, passwordHash: hash });
    await user.save();
    return user;
}

async function authenticate({ email, password }) {
    // defend against query-object injection by forcing the email to be treated as a literal value
    const user = await User.findOne({ email: { $eq: email } }).exec();
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;
    const token = makeAccessToken(user);
    // issue refresh token (store hash on user)
    const refreshPlain = makeRefreshPlain(user._id);
    const refreshHash = await bcrypt.hash(refreshPlain.split(':')[1], 10);
    user.refreshTokenHash = refreshHash;
    await user.save();
    return { user, token, refreshToken: refreshPlain };
}

async function refreshTokens(refreshPlain) {
    const [userId, rand] = (refreshPlain || '').split(':');
    if (!userId || !rand) throw new Error('Invalid');
    const user = await User.findById(userId).exec();
    if (!user || !user.refreshTokenHash) throw new Error('Invalid');
    const ok = await bcrypt.compare(rand, user.refreshTokenHash);
    if (!ok) throw new Error('Invalid');
    // rotate refresh token
    const newRefreshPlain = makeRefreshPlain(user._id);
    const newHash = await bcrypt.hash(newRefreshPlain.split(':')[1], 10);
    user.refreshTokenHash = newHash;
    await user.save();
    const token = makeAccessToken(user);
    return { token, refreshToken: newRefreshPlain };
}

async function logout(refreshPlain) {
    const [userId, rand] = (refreshPlain || '').split(':');
    if (!userId || !rand) throw new Error('Invalid');
    const user = await User.findById(userId).exec();
    if (!user || !user.refreshTokenHash) throw new Error('Invalid');
    const ok = await bcrypt.compare(rand, user.refreshTokenHash);
    if (!ok) throw new Error('Invalid');
    user.refreshTokenHash = undefined;
    await user.save();
    return true;
}

module.exports = { register, authenticate, refreshTokens, logout };
