const Budget = require('../models/budget');

async function createOrUpdateBudget(userId, { categoryId, month, amount }) {
    // Defensive checks to avoid query-object injection from downstream callers
    // categoryId may be an ObjectId or a string representing an ObjectId
    const isValidCategoryId = typeof categoryId === 'string' || Budget.db.base.Types.ObjectId.isValid(categoryId);
    if (!isValidCategoryId || typeof month !== 'string') {
        throw new TypeError('Invalid budget filter input');
    }
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
        throw new TypeError('Invalid amount');
    }
    const filter = { userId, categoryId, month };
    const update = { amount };
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    return Budget.findOneAndUpdate(filter, update, opts).exec();
}

async function listBudgets(userId) {
    return Budget.find({ userId }).exec();
}

async function deleteBudget(userId, id) {
    return Budget.findOneAndDelete({ _id: id, userId }).exec();
}

module.exports = { createOrUpdateBudget, listBudgets, deleteBudget };
