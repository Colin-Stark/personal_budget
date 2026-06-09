const mongoose = require('mongoose');
const { createOrUpdateBudget, listBudgets, deleteBudget } = require('../../../src/services/budgetService');

const mongo = require('../../helpers/mongo');
beforeAll(async () => {
    await mongo.start();
});
afterAll(async () => {
    await mongo.stop();
});

describe('budgetService defensive checks', () => {
    test('createOrUpdateBudget throws for non-string categoryId/month', async () => {
        const userId = new mongoose.Types.ObjectId();
        await expect(createOrUpdateBudget(userId, { categoryId: { $ne: 1 }, month: '2024-01', amount: 10 }))
            .rejects.toThrow(TypeError);
        await expect(createOrUpdateBudget(userId, { categoryId: 'cat', month: { $gt: '2024-01' }, amount: 10 }))
            .rejects.toThrow(TypeError);
    });

    test('createOrUpdateBudget throws for invalid amount', async () => {
        const userId = new mongoose.Types.ObjectId();
        await expect(createOrUpdateBudget(userId, { categoryId: 'c', month: '2024-01', amount: NaN }))
            .rejects.toThrow(TypeError);
        await expect(createOrUpdateBudget(userId, { categoryId: 'c', month: '2024-01', amount: '100' }))
            .rejects.toThrow(TypeError);
    });

    test('createOrUpdateBudget upserts and returns document for valid input', async () => {
        const userId = new mongoose.Types.ObjectId();
        const categoryId = new mongoose.Types.ObjectId().toString();
        const res = await createOrUpdateBudget(userId, { categoryId, month: '2024-01', amount: 150 });
        expect(res).toHaveProperty('_id');
        const list = await listBudgets(userId);
        expect(list.length).toBe(1);
        await deleteBudget(userId, res._id.toString());
        const after = await listBudgets(userId);
        expect(after.length).toBe(0);
    });
});
