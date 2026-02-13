const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateBody, Joi } = require('../middleware/validation');
const { createOrUpdateBudget, listBudgets, deleteBudget } = require('../services/budgetService');

const budgetSchema = Joi.object({ categoryId: Joi.string().required(), month: Joi.string().pattern(/^\d{4}-\d{2}$/).required(), amount: Joi.number().required() });

router.post('/', auth, validateBody(budgetSchema), async (req, res) => {
  const b = await createOrUpdateBudget(req.user._id, req.body);
  res.status(201).json(b);
});

router.get('/', auth, async (req, res) => {
  const b = await listBudgets(req.user._id);
  res.json(b);
});

router.delete('/:id', auth, async (req, res) => {
  const b = await deleteBudget(req.user._id, req.params.id);
  if (!b) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});

module.exports = router;
