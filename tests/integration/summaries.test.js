const request = require('supertest');
const mongoose = require('mongoose');
const mongo = require('../helpers/mongo');
const app = require('../../server');
const Transaction = require('../../src/models/transaction');

beforeAll(async () => {
    await mongo.start();
});
afterAll(async () => {
    const User = require('../../src/models/user');
    const Transaction = require('../../src/models/transaction');
    try {
        const user = await User.findOne({ email: 'sum@example.com' }).exec();
        if (user) {
            // remove transactions for this user (including perf inserts)
            await Transaction.deleteMany({ userId: user._id });
            await Transaction.deleteMany({ idempotencyKey: { $regex: '^perf-' } });
            await User.deleteOne({ _id: user._id });
        } else {
            // still try to remove perf_* transactions if any
            await Transaction.deleteMany({ idempotencyKey: { $regex: '^perf-' } });
        }
    } catch (e) {
        // ignore cleanup errors
    } finally {
        await mongo.stop();
    }
});

describe('Summaries', () => {
    let token;
    let userId;
    beforeAll(async () => {
        await request(app).post('/api/v1/auth/register').send({ email: 'sum@example.com', password: 'pw1234', displayName: 'S' });
        const res = await request(app).post('/api/v1/auth/login').send({ email: 'sum@example.com', password: 'pw1234' });
        token = res.body.token;
        userId = res.body.user.id;
    });

    test('monthly summary returns totals and byCategory', async () => {
        // insert some transactions
        await request(app).post('/api/v1/transactions').set('Authorization', `Bearer ${token}`).send({ accountId: '000000000000000000000020', date: '2026-02-10T00:00:00.000Z', amount: 100, categoryId: 'cat1' });
        await request(app).post('/api/v1/transactions').set('Authorization', `Bearer ${token}`).send({ accountId: '000000000000000000000020', date: '2026-02-11T00:00:00.000Z', amount: 50, categoryId: 'cat2' });

        const r = await request(app).get('/api/v1/summaries/monthly').set('Authorization', `Bearer ${token}`).query({ year: 2026, month: 2 });
        expect(r.status).toBe(200);
        expect(r.body).toHaveProperty('totals');
        expect(r.body).toHaveProperty('byCategory');
    });

    test('performance smoke: monthly summary for 1000 transactions', async () => {
        const accountId = new mongoose.Types.ObjectId();
        const inserts = [];
        const uid = new mongoose.Types.ObjectId(userId);
        for (let i = 0; i < 1000; i++) {
            inserts.push(Transaction.create({ userId: uid, accountId, date: new Date('2026-02-15'), amount: 1, idempotencyKey: `perf-${i}` }));
        }
        await Promise.all(inserts);

        const start = Date.now();
        const r = await request(app).get('/api/v1/summaries/monthly').set('Authorization', `Bearer ${token}`).query({ year: 2026, month: 2 });
        const elapsed = Date.now() - start;

        expect(r.status).toBe(200);
        // smoke threshold (adjustable): 1500ms
        expect(elapsed).toBeLessThanOrEqual(1500);
    }, 20000);
});
