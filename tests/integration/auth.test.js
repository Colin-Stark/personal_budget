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
        for (const email of ['a@example.com', 'x@example.com']) {
            const user = await User.findOne({ email }).exec();
            if (user) {
                await Transaction.deleteMany({ userId: user._id });
                await User.deleteOne({ _id: user._id });
            }
        }
    } catch (e) {
        // ignore cleanup errors
    } finally {
        await mongo.stop();
    }
});

describe('Auth', () => {
    test('register -> login flow', async () => {
        const reg = await request(app).post('/api/v1/auth/register').send({ email: 'a@example.com', password: 'pass123', displayName: 'A' });
        expect(reg.status).toBe(201);

        const login = await request(app).post('/api/v1/auth/login').send({ email: 'a@example.com', password: 'pass123' });
        expect(login.status).toBe(200);
        expect(login.body).toHaveProperty('token');
        expect(login.body).toHaveProperty('refreshToken');
    });

    test('refresh -> logout flow', async () => {
        await request(app).post('/api/v1/auth/register').send({ email: 'x@example.com', password: 'pw1234', displayName: 'X' });
        const login = await request(app).post('/api/v1/auth/login').send({ email: 'x@example.com', password: 'pw1234' });
        const refresh = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: login.body.refreshToken });
        expect(refresh.status).toBe(200);
        expect(refresh.body).toHaveProperty('token');
        // logout
        const logout = await request(app).post('/api/v1/auth/logout').send({ refreshToken: refresh.body.refreshToken });
        expect(logout.status).toBe(204);
        // using the same refresh token should now fail
        const refresh2 = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: refresh.body.refreshToken });
        expect(refresh2.status).toBe(401);
    });
});
