const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createTransaction, listTransactions, softDeleteTransaction } = require('../services/transactionService');

router.post('/', auth, async (req, res) => {
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
