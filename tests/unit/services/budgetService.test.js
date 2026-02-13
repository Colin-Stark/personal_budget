const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Budget = require('../../../src/models/budget');
const { createOrUpdateBudget, listBudgets, deleteBudget } = require('../../../src/services/budgetService');

let mongo;
beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});
afterAll(async () => {
    await mongoose.disconnect();
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
        const categoryId = new mongoose.Types.ObjectId();
        const res = await createOrUpdateBudget(userId, { categoryId, month: '2024-01', amount: 150 });
        expect(res).toHaveProperty('_id');
        const list = await listBudgets(userId);
        expect(list.length).toBe(1);
        await deleteBudget(userId, res._id);
        const after = await listBudgets(userId);
        expect(after.length).toBe(0);
    });
});
