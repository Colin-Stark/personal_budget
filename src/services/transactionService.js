const Transaction = require('../models/transaction');

async function createTransaction(userId, payload) {
  // idempotency handling via idempotencyKey
  if (payload.idempotencyKey) {
    const existing = await Transaction.findOne({ userId, idempotencyKey: payload.idempotencyKey }).exec();
    if (existing) return existing;
  }

  const tx = new Transaction(Object.assign({}, payload, { userId }));
  await tx.save();
  return tx;
}

async function listTransactions(userId, query = {}) {
  const filter = { userId, isDeleted: false };
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = new Date(query.from);
    if (query.to) filter.date.$lte = new Date(query.to);
  }
  return Transaction.find(filter).sort({ date: -1 }).limit(100).exec();
}

async function softDeleteTransaction(userId, txId) {
  const tx = await Transaction.findOne({ _id: txId, userId }).exec();
  if (!tx) return null;
  tx.isDeleted = true;
  tx.deletedAt = new Date();
  tx.deletedBy = userId;
  await tx.save();
  return tx;
}

module.exports = { createTransaction, listTransactions, softDeleteTransaction };
