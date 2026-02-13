const express = require('express');
const router = express.Router();
const { register, authenticate } = require('../services/authService');

router.post('/register', async (req, res) => {
  try {
    const user = await register(req.body);
    return res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  const result = await authenticate(req.body);
  if (!result) return res.status(401).json({ message: 'Invalid credentials' });
  return res.json({ token: result.token, user: { id: result.user._id, email: result.user.email } });
});

module.exports = router;
