const Transaction = require('../models/transaction');

async function createTransaction(userId, payload) {
    // idempotency handling via idempotencyKey (sanitize input first)
    const rawIdempotencyKey = payload && payload.idempotencyKey;
    const safeIdempotencyKey = typeof rawIdempotencyKey === 'string' ? rawIdempotencyKey.trim() : null;
    if (safeIdempotencyKey) {
        // normalize stored value so lookups remain consistent
        payload.idempotencyKey = safeIdempotencyKey;
        const existing = await Transaction.findOne({ userId, idempotencyKey: safeIdempotencyKey }).exec();
        if (existing) return existing;
    } else {
        // remove any non-string idempotencyKey to avoid persisting invalid types
        if (Object.prototype.hasOwnProperty.call(payload, 'idempotencyKey')) delete payload.idempotencyKey;
    }

    // Build a clean document object to avoid inserting explicit `null` for optional fields
    const doc = {
        userId,
        accountId: payload.accountId,
        date: payload.date,
        amount: payload.amount,
    };
    if (payload.currency) doc.currency = payload.currency;
    if (payload.categoryId) doc.categoryId = payload.categoryId;
    if (payload.description) doc.description = payload.description;
    if (payload.metadata) doc.metadata = payload.metadata;
    if (Object.prototype.hasOwnProperty.call(payload, 'idempotencyKey')) doc.idempotencyKey = payload.idempotencyKey;

    const tx = new Transaction(doc);
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
