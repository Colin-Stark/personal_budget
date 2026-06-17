const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { validateBody, validateParams, Joi } = require('../middleware/validation');
const {
    createCategory,
    listCategories,
    getCategory,
    updateCategory,
    deleteCategory
} = require('../services/categoryService');

const categoriesLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});

router.use(categoriesLimiter);

const createCategorySchema = Joi.object({
    name: Joi.string().min(1).max(50).required(),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon: Joi.string().max(30).optional(),
    isDefault: Joi.boolean().optional(),
    order: Joi.number().integer().min(0).optional()
});

const updateCategorySchema = Joi.object({
    name: Joi.string().min(1).max(50).optional(),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon: Joi.string().max(30).optional(),
    isDefault: Joi.boolean().optional(),
    order: Joi.number().integer().min(0).optional()
}).min(1);

const idParamSchema = Joi.object({
    id: Joi.string().required()
});

router.post('/', auth, validateBody(createCategorySchema), async (req, res) => {
    try {
        const category = await createCategory(req.user._id, req.body);
        res.status(201).json(category);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Category with this name already exists' });
        }
        return res.status(400).json({ message: err.message });
    }
});

router.get('/', auth, async (req, res) => {
    const categories = await listCategories(req.user._id);
    res.json(categories);
});

router.get('/:id', auth, validateParams(idParamSchema), async (req, res) => {
    const category = await getCategory(req.user._id, req.params.id);
    if (!category) return res.status(404).json({ message: 'Not found' });
    res.json(category);
});

router.patch('/:id', auth, validateParams(idParamSchema), validateBody(updateCategorySchema), async (req, res) => {
    try {
        const category = await updateCategory(req.user._id, req.params.id, req.body);
        if (!category) return res.status(404).json({ message: 'Not found' });
        res.json(category);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Category with this name already exists' });
        }
        return res.status(400).json({ message: err.message });
    }
});

router.delete('/:id', auth, validateParams(idParamSchema), async (req, res) => {
    try {
        const category = await deleteCategory(req.user._id, req.params.id);
        if (!category) return res.status(404).json({ message: 'Not found' });
        res.status(204).send();
    } catch (err) {
        if (err.code === 'CATEGORY_IN_USE') {
            return res.status(409).json({
                message: 'Cannot delete category - it is in use',
                details: err.details
            });
        }
        return res.status(400).json({ message: err.message });
    }
});

module.exports = router;