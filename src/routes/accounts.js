const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { validateBody, validateParams, Joi } = require('../middleware/validation');
const {
    createAccount,
    listAccounts,
    getAccount,
    updateAccount,
    deleteAccount
} = require('../services/accountService');

const accountsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});

router.use(accountsLimiter);

const createAccountSchema = Joi.object({
    name: Joi.string().min(1).max(50).required(),
    type: Joi.string().valid('checking', 'savings', 'credit', 'cash', 'investment', 'other').required(),
    currency: Joi.string().length(3).optional(),
    balance: Joi.number().optional(),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon: Joi.string().max(30).optional(),
    isDefault: Joi.boolean().optional(),
    order: Joi.number().integer().min(0).optional()
});

const updateAccountSchema = Joi.object({
    name: Joi.string().min(1).max(50).optional(),
    type: Joi.string().valid('checking', 'savings', 'credit', 'cash', 'investment', 'other').optional(),
    currency: Joi.string().length(3).optional(),
    balance: Joi.number().optional(),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon: Joi.string().max(30).optional(),
    isDefault: Joi.boolean().optional(),
    order: Joi.number().integer().min(0).optional()
}).min(1);

const idParamSchema = Joi.object({
    id: Joi.string().required()
});

router.post('/', auth, validateBody(createAccountSchema), async (req, res) => {
    try {
        const account = await createAccount(req.user._id, req.body);
        res.status(201).json(account);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Account with this name already exists' });
        }
        return res.status(400).json({ message: err.message });
    }
});

router.get('/', auth, async (req, res) => {
    const accounts = await listAccounts(req.user._id);
    res.json(accounts);
});

router.get('/:id', auth, validateParams(idParamSchema), async (req, res) => {
    const account = await getAccount(req.user._id, req.params.id);
    if (!account) return res.status(404).json({ message: 'Not found' });
    res.json(account);
});

router.patch('/:id', auth, validateParams(idParamSchema), validateBody(updateAccountSchema), async (req, res) => {
    try {
        const account = await updateAccount(req.user._id, req.params.id, req.body);
        if (!account) return res.status(404).json({ message: 'Not found' });
        res.json(account);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Account with this name already exists' });
        }
        return res.status(400).json({ message: err.message });
    }
});

router.delete('/:id', auth, validateParams(idParamSchema), async (req, res) => {
    try {
        const account = await deleteAccount(req.user._id, req.params.id);
        if (!account) return res.status(404).json({ message: 'Not found' });
        res.status(204).send();
    } catch (err) {
        if (err.code === 'ACCOUNT_IN_USE') {
            return res.status(409).json({
                message: 'Cannot delete account - it is in use',
                details: err.details
            });
        }
        return res.status(400).json({ message: err.message });
    }
});

module.exports = router;