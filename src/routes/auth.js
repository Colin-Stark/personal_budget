const express = require('express');
const router = express.Router();
const { validateBody, Joi } = require('../middleware/validation');
const { register, authenticate, refreshTokens, logout } = require('../services/authService');

const registerSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().min(6).required(), displayName: Joi.string().allow('', null) });
const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });
const refreshSchema = Joi.object({ refreshToken: Joi.string().required() });

router.post('/register', validateBody(registerSchema), async (req, res) => {
  try {
    const user = await register(req.body);
    return res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.post('/login', validateBody(loginSchema), async (req, res) => {
  const result = await authenticate(req.body);
  if (!result) return res.status(401).json({ message: 'Invalid credentials' });
  return res.json({ token: result.token, refreshToken: result.refreshToken, user: { id: result.user._id, email: result.user.email } });
});

router.post('/refresh', validateBody(refreshSchema), async (req, res) => {
  try {
    const { token, refreshToken } = await refreshTokens(req.body.refreshToken);
    return res.json({ token, refreshToken });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

router.post('/logout', validateBody(refreshSchema), async (req, res) => {
  try {
    await logout(req.body.refreshToken);
    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ message: 'Invalid request' });
  }
});

module.exports = router;
