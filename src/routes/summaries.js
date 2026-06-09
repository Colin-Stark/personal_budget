const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { monthlySummary } = require('../services/summaryService');

const summaryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

router.use(summaryLimiter);

router.get('/monthly', auth, async (req, res) => {
    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10);
    if (!year || !month) return res.status(400).json({ message: 'year and month required' });
    const summary = await monthlySummary(req.user._id, year, month);
    res.json(summary);
});

module.exports = router;
