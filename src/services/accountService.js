const Account = require('../models/account');
const Transaction = require('../models/transaction');
const Budget = require('../models/budget');

async function createAccount(userId, { name, type, currency, balance, color, icon, isDefault, order }) {
    const doc = {
        userId,
        name: name.trim(),
        type,
        currency: currency || 'USD',
        balance: typeof balance === 'number' ? balance : 0,
        color: color || '#10b981',
        icon: icon || 'credit-card',
        isDefault: isDefault || false,
        order: typeof order === 'number' ? order : 0
    };
    const account = new Account(doc);
    await account.save();
    return account;
}

async function listAccounts(userId) {
    return Account.find({ userId }).sort({ order: 1, name: 1 }).exec();
}

async function getAccount(userId, accountId) {
    if (typeof accountId !== 'string') {
        throw new TypeError('Invalid account id');
    }
    return Account.findOne({ _id: accountId, userId }).exec();
}

async function updateAccount(userId, accountId, updates) {
    if (typeof accountId !== 'string') {
        throw new TypeError('Invalid account id');
    }

    const allowedUpdates = ['name', 'type', 'currency', 'balance', 'color', 'icon', 'isDefault', 'order'];
    const updateDoc = {};
    for (const key of allowedUpdates) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
            if (key === 'name') updateDoc.name = updates.name.trim();
            else if (key === 'balance') updateDoc.balance = typeof updates.balance === 'number' ? updates.balance : 0;
            else if (key === 'order') updateDoc.order = typeof updates.order === 'number' ? updates.order : 0;
            else updateDoc[key] = updates[key];
        }
    }

    if (Object.keys(updateDoc).length === 0) {
        throw new TypeError('No valid fields to update');
    }

    return Account.findOneAndUpdate(
        { _id: accountId, userId },
        updateDoc,
        { returnDocument: 'after' }
    ).exec();
}

async function deleteAccount(userId, accountId) {
    if (typeof accountId !== 'string') {
        throw new TypeError('Invalid account id');
    }

    // Check if account is in use by transactions
    const transactionCount = await Transaction.countDocuments({ userId, accountId }).exec();

    if (transactionCount > 0) {
        const error = new Error('Account is in use by transactions');
        error.code = 'ACCOUNT_IN_USE';
        error.details = { transactionCount };
        throw error;
    }

    return Account.findOneAndDelete({ _id: accountId, userId }).exec();
}

module.exports = {
    createAccount,
    listAccounts,
    getAccount,
    updateAccount,
    deleteAccount
};