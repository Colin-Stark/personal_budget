const Budget = require('../models/budget');

async function createOrUpdateBudget(userId, { categoryId, month, amount }) {
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
