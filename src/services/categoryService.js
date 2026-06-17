const Category = require('../models/category');
const Budget = require('../models/budget');
const Transaction = require('../models/transaction');

async function createCategory(userId, { name, color, icon, isDefault, order }) {
    const doc = {
        userId,
        name: name.trim(),
        color: color || '#6366f1',
        icon: icon || 'wallet',
        isDefault: isDefault || false,
        order: typeof order === 'number' ? order : 0
    };
    const category = new Category(doc);
    await category.save();
    return category;
}

async function listCategories(userId) {
    return Category.find({ userId }).sort({ order: 1, name: 1 }).exec();
}

async function getCategory(userId, categoryId) {
    if (typeof categoryId !== 'string') {
        throw new TypeError('Invalid category id');
    }
    return Category.findOne({ _id: categoryId, userId }).exec();
}

async function updateCategory(userId, categoryId, updates) {
    if (typeof categoryId !== 'string') {
        throw new TypeError('Invalid category id');
    }

    const allowedUpdates = ['name', 'color', 'icon', 'isDefault', 'order'];
    const updateDoc = {};
    for (const key of allowedUpdates) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
            if (key === 'name') updateDoc.name = updates.name.trim();
            else if (key === 'order') updateDoc.order = typeof updates.order === 'number' ? updates.order : 0;
            else updateDoc[key] = updates[key];
        }
    }

    if (Object.keys(updateDoc).length === 0) {
        throw new TypeError('No valid fields to update');
    }

    return Category.findOneAndUpdate(
        { _id: categoryId, userId },
        updateDoc,
        { returnDocument: 'after' }
    ).exec();
}

async function deleteCategory(userId, categoryId) {
    if (typeof categoryId !== 'string') {
        throw new TypeError('Invalid category id');
    }

    // Check if category is in use
    const [budgetCount, transactionCount] = await Promise.all([
        Budget.countDocuments({ userId, categoryId }).exec(),
        Transaction.countDocuments({ userId, categoryId }).exec()
    ]);

    if (budgetCount > 0 || transactionCount > 0) {
        const error = new Error('Category is in use by budgets or transactions');
        error.code = 'CATEGORY_IN_USE';
        error.details = { budgetCount, transactionCount };
        throw error;
    }

    return Category.findOneAndDelete({ _id: categoryId, userId }).exec();
}

module.exports = {
    createCategory,
    listCategories,
    getCategory,
    updateCategory,
    deleteCategory
};