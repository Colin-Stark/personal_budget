const request = require('supertest');
const mongo = require('../helpers/mongo');
const app = require('../../server');

beforeAll(async () => {
    await mongo.start();
});

afterAll(async () => {
    const User = require('../../src/models/user');
    const Transaction = require('../../src/models/transaction');
    try {
        const user = await User.findOne({ email: 'bob@example.com' }).exec();
        if (user) {
            await Transaction.deleteMany({ userId: user._id });
            await User.deleteOne({ _id: user._id });
        }
    } catch (e) {
        // ignore cleanup errors
    } finally {
        await mongo.stop();
    }
});

describe('Transactions', () => {
    let token;
    beforeAll(async () => {
        await request(app).post('/api/v1/auth/register').send({ email: 'bob@example.com', password: 'pw1234', displayName: 'Bob' });
        const res = await request(app).post('/api/v1/auth/login').send({ email: 'bob@example.com', password: 'pw1234' });
        token = res.body.token;
    });

    test('create transaction with idempotency', async () => {
        const body = { accountId: '000000000000000000000001', date: new Date().toISOString(), amount: 10, idempotencyKey: 'key-1' };
        const r1 = await request(app).post('/api/v1/transactions').set('Authorization', `Bearer ${token}`).send(body);
        expect(r1.status).toBe(201);
        const r2 = await request(app).post('/api/v1/transactions').set('Authorization', `Bearer ${token}`).send(body);
        expect(r2.status).toBe(201);
        expect(r2.body._id).toEqual(r1.body._id);
    });

    test('soft delete transaction', async () => {
        const body = { accountId: '000000000000000000000002', date: new Date().toISOString(), amount: 5 };
        const r = await request(app).post('/api/v1/transactions').set('Authorization', `Bearer ${token}`).send(body);
        expect(r.status).toBe(201);
        const id = r.body._id;
        const del = await request(app).delete(`/api/v1/transactions/${id}`).set('Authorization', `Bearer ${token}`);
        expect(del.status).toBe(204);
        const list = await request(app).get('/api/v1/transactions').set('Authorization', `Bearer ${token}`);
        expect(list.body.find((t) => t._id === id)).toBeUndefined();
    });
});
