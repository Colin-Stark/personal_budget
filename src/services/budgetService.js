const Budget = require('../models/budget');

async function createOrUpdateBudget(userId, { categoryId, month, amount }) {
    // Defensive checks to avoid query-object injection from downstream callers.
    // Ensure categoryId and month are primitive strings so they cannot contain query operators.
    if (typeof categoryId !== 'string' || categoryId.length === 0 || typeof month !== 'string') {
        throw new TypeError('Invalid budget filter input');
    }
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
        throw new TypeError('Invalid amount');
    }
    const filter = {
        userId,
        categoryId: { $eq: categoryId },
        month: { $eq: month }
    };
    const update = { amount };
    const opts = { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true };
    return Budget.findOneAndUpdate(filter, update, opts).exec();
}

async function listBudgets(userId) {
    return Budget.find({ userId }).exec();
}

async function deleteBudget(userId, id) {
    if (typeof id !== 'string') {
        throw new TypeError('Invalid budget id');
    }
    return Budget.findOneAndDelete({ _id: { $eq: id }, userId }).exec();
}

module.exports = { createOrUpdateBudget, listBudgets, deleteBudget };
