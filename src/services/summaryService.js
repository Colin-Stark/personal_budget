const Transaction = require('../models/transaction');
const Budget = require('../models/budget');

// month: 'YYYY-MM'
async function monthlySummary(userId, year, month) {
  const from = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`);
  const to = new Date(from);
  to.setMonth(to.getMonth() + 1);

  // aggregate totals and per-category
  const agg = await Transaction.aggregate([
    { $match: { userId, isDeleted: false, date: { $gte: from, $lt: to } } },
    {
      $group: {
        _id: '$categoryId',
        total: { $sum: '$amount' }
      }
    }
  ]).exec();

  const totals = agg.reduce((acc, cur) => {
    const key = cur._id ? cur._id.toString() : 'uncategorized';
    acc.byCategory[key] = cur.total;
    acc.total += cur.total;
    return acc;
  }, { total: 0, byCategory: {} });

  // budgets for the month
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const budgets = await Budget.find({ userId, month: monthKey }).lean().exec();

  const budgetProgress = budgets.map((b) => ({
    categoryId: b.categoryId.toString(),
    budget: b.amount,
    spent: totals.byCategory[b.categoryId.toString()] || 0,
    percent: Math.round(((totals.byCategory[b.categoryId.toString()] || 0) / b.amount) * 100)
  }));

  return { totals: totals.total, byCategory: totals.byCategory, budgets: budgetProgress };
}

module.exports = { monthlySummary };
