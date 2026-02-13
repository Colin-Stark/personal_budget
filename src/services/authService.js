const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

async function register({ email, password, displayName }) {
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ email, displayName, passwordHash: hash });
  await user.save();
  return user;
}

async function authenticate({ email, password }) {
  const user = await User.findOne({ email }).exec();
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  return { user, token };
}

module.exports = { register, authenticate };
