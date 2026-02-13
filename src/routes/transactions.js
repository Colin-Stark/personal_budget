const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { validateBody, Joi } = require('../middleware/validation');
const { createTransaction, listTransactions, softDeleteTransaction } = require('../services/transactionService');

const transactionsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs for transaction routes
});

router.use(transactionsLimiter);

const transactionSchema = Joi.object({
    accountId: Joi.string().required(),
    date: Joi.date().iso().required(),
    amount: Joi.number().required(),
    currency: Joi.string().optional(),
    categoryId: Joi.string().optional(),
    description: Joi.string().optional(),
    idempotencyKey: Joi.string().optional()
});

router.post('/', auth, validateBody(transactionSchema), async (req, res) => {
    try {
        const payload = Object.assign({}, req.body);
        const tx = await createTransaction(req.user._id, payload);
        return res.status(201).json(tx);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
});

router.get('/', auth, async (req, res) => {
    const txs = await listTransactions(req.user._id, req.query);
    res.json(txs);
});

router.delete('/:id', auth, async (req, res) => {
    const tx = await softDeleteTransaction(req.user._id, req.params.id);
    if (!tx) return res.status(404).json({ message: 'Not found' });
    return res.status(204).send();
});

module.exports = router;
