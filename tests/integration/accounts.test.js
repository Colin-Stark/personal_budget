const request = require('supertest');
const mongo = require('../helpers/mongo');
const app = require('../../server');

beforeAll(async () => {
    await mongo.start();
});

afterAll(async () => {
    const User = require('../../src/models/user');
    const Account = require('../../src/models/account');
    const Budget = require('../../src/models/budget');
    const Transaction = require('../../src/models/transaction');
    try {
        const user = await User.findOne({ email: 'acc@example.com' }).exec();
        if (user) {
            // Clean up in reverse dependency order
            await Transaction.deleteMany({ userId: user._id });
            await Budget.deleteMany({ userId: user._id });
            await Account.deleteMany({ userId: user._id });
            await User.deleteOne({ _id: user._id });
        }
    } catch (e) {
        // ignore cleanup errors
    } finally {
        await mongo.stop();
    }
});

describe('Accounts CRUD', () => {
    let token;
    let accountId;

    beforeAll(async () => {
        // Register and login a test user
        await request(app).post('/api/v1/auth/register').send({ email: 'acc@example.com', password: 'pw1234', displayName: 'Acc User' });
        const res = await request(app).post('/api/v1/auth/login').send({ email: 'acc@example.com', password: 'pw1234' });
        token = res.body.token;
    });

    test('POST /api/v1/accounts - create account (should return _id)', async () => {
        const payload = {
            name: 'Main Checking',
            type: 'checking',
            currency: 'USD',
            balance: 1000,
            color: '#10b981',
            icon: 'credit-card',
            isDefault: true,
            order: 1
        };
        const res = await request(app)
            .post('/api/v1/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.name).toBe('Main Checking');
        expect(res.body.type).toBe('checking');
        expect(res.body.currency).toBe('USD');
        expect(res.body.balance).toBe(1000);
        expect(res.body.color).toBe('#10b981');
        expect(res.body.icon).toBe('credit-card');
        expect(res.body.isDefault).toBe(true);
        expect(res.body.order).toBe(1);
        expect(res.body).toHaveProperty('createdAt');
        expect(res.body).toHaveProperty('updatedAt');

        // Store the account ID for subsequent tests
        accountId = res.body._id;
    });

    test('POST /api/v1/accounts - create account with defaults (minimal payload)', async () => {
        const payload = { name: 'Savings', type: 'savings' };
        const res = await request(app)
            .post('/api/v1/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.name).toBe('Savings');
        expect(res.body.type).toBe('savings');
        expect(res.body.currency).toBe('USD'); // default currency
        expect(res.body.balance).toBe(0); // default balance
        expect(res.body.color).toBe('#10b981'); // default color
        expect(res.body.icon).toBe('credit-card'); // default icon
        expect(res.body.isDefault).toBe(false); // default
        expect(res.body.order).toBe(0); // default
    });

    test('POST /api/v1/accounts - reject duplicate account name for same user', async () => {
        const payload = { name: 'Main Checking', type: 'checking' }; // Already created above
        const res = await request(app)
            .post('/api/v1/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('Account with this name already exists');
    });

    test('POST /api/v1/accounts - reject missing required name field', async () => {
        const payload = { type: 'checking', color: '#ff0000' };
        const res = await request(app)
            .post('/api/v1/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(400);
    });

    test('POST /api/v1/accounts - reject missing required type field', async () => {
        const payload = { name: 'No Type' };
        const res = await request(app)
            .post('/api/v1/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(400);
    });

    test('POST /api/v1/accounts - reject invalid account type', async () => {
        const payload = { name: 'Invalid Type', type: 'invalid-type' };
        const res = await request(app)
            .post('/api/v1/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(400);
    });

    test('POST /api/v1/accounts - reject invalid color format', async () => {
        const payload = { name: 'Invalid Color', type: 'checking', color: 'not-a-hex-color' };
        const res = await request(app)
            .post('/api/v1/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(400);
    });

    test('POST /api/v1/accounts - reject invalid currency length', async () => {
        const payload = { name: 'Invalid Currency', type: 'checking', currency: 'USDD' };
        const res = await request(app)
            .post('/api/v1/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(400);
    });

    test('POST /api/v1/accounts - reject name exceeding max length', async () => {
        const payload = { name: 'a'.repeat(51), type: 'checking' }; // max is 50
        const res = await request(app)
            .post('/api/v1/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(400);
    });

    test('GET /api/v1/accounts - list accounts (should include created ones)', async () => {
        const res = await request(app)
            .get('/api/v1/accounts')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(2); // Main Checking + Savings

        const checking = res.body.find(c => c.name === 'Main Checking');
        expect(checking).toBeDefined();
        expect(checking.type).toBe('checking');
        expect(checking.color).toBe('#10b981');
        expect(checking.icon).toBe('credit-card');
    });

    test('GET /api/v1/accounts/:id - get single account', async () => {
        const res = await request(app)
            .get(`/api/v1/accounts/${accountId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body._id).toBe(accountId);
        expect(res.body.name).toBe('Main Checking');
        expect(res.body.type).toBe('checking');
        expect(res.body.balance).toBe(1000);
    });

    test('GET /api/v1/accounts/:id - return 404 for non-existent account', async () => {
        const fakeId = '000000000000000000000000';
        const res = await request(app)
            .get(`/api/v1/accounts/${fakeId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Not found');
    });

    test('GET /api/v1/accounts/:id - return 404 for account belonging to another user', async () => {
        // Create another user and account
        const uniqueEmail = `acc2_${Date.now()}@example.com`;
        await request(app).post('/api/v1/auth/register').send({ email: uniqueEmail, password: 'pw1234', displayName: 'Acc User 2' });
        const login2 = await request(app).post('/api/v1/auth/login').send({ email: uniqueEmail, password: 'pw1234' });
        const token2 = login2.body.token;

        const createRes = await request(app)
            .post('/api/v1/accounts')
            .set('Authorization', `Bearer ${token2}`)
            .send({ name: 'Other User Account', type: 'checking' });
        expect(createRes.status).toBe(201);
        const otherAccountId = createRes.body._id;

        // Try to access it with first user's token
        const res = await request(app)
            .get(`/api/v1/accounts/${otherAccountId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    test('PATCH /api/v1/accounts/:id - update account name and color', async () => {
        const payload = { name: 'Primary Checking', color: '#f59e0b' };
        const res = await request(app)
            .patch(`/api/v1/accounts/${accountId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body._id).toBe(accountId);
        expect(res.body.name).toBe('Primary Checking');
        expect(res.body.color).toBe('#f59e0b');
        expect(res.body.icon).toBe('credit-card'); // unchanged
    });

    test('PATCH /api/v1/accounts/:id - update only icon', async () => {
        const payload = { icon: 'bank' };
        const res = await request(app)
            .patch(`/api/v1/accounts/${accountId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.icon).toBe('bank');
        expect(res.body.name).toBe('Primary Checking'); // unchanged from previous update
    });

    test('PATCH /api/v1/accounts/:id - update balance', async () => {
        const payload = { balance: 2500 };
        const res = await request(app)
            .patch(`/api/v1/accounts/${accountId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.balance).toBe(2500);
    });

    test('PATCH /api/v1/accounts/:id - update isDefault and order', async () => {
        const payload = { isDefault: false, order: 5 };
        const res = await request(app)
            .patch(`/api/v1/accounts/${accountId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.isDefault).toBe(false);
        expect(res.body.order).toBe(5);
    });

    test('PATCH /api/v1/accounts/:id - reject empty update payload', async () => {
        const res = await request(app)
            .patch(`/api/v1/accounts/${accountId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
    });

    test('PATCH /api/v1/accounts/:id - reject duplicate name update', async () => {
        // First create another account
        const createRes = await request(app)
            .post('/api/v1/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Credit Card', type: 'credit' });
        expect(createRes.status).toBe(201);

        // Try to update existing account to have the same name
        const res = await request(app)
            .patch(`/api/v1/accounts/${accountId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Credit Card' });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('Account with this name already exists');
    });

    test('PATCH /api/v1/accounts/:id - return 404 for non-existent account', async () => {
        const fakeId = '000000000000000000000000';
        const res = await request(app)
            .patch(`/api/v1/accounts/${fakeId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'New Name' });

        expect(res.status).toBe(404);
    });

    test('DELETE /api/v1/accounts/:id - fail to delete account in use by transaction (409)', async () => {
        jest.setTimeout(15000);

        // Create an account to use with transaction
        const accRes = await request(app)
            .post('/api/v1/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Transaction Account', type: 'checking' });
        expect(accRes.status).toBe(201);
        const transactionAccountId = accRes.body._id;

        // Use a hardcoded valid ObjectId for categoryId (like transactions tests do)
        const categoryId = '000000000000000000000001';

        // Create a transaction using this account
        const txnRes = await request(app)
            .post('/api/v1/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({
                accountId: transactionAccountId,
                categoryId,
                date: new Date().toISOString(),
                amount: 50
            });
        expect(txnRes.status).toBe(201);

        // Try to delete the account - should fail with 409
        const delRes = await request(app)
            .delete(`/api/v1/accounts/${transactionAccountId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(delRes.status).toBe(409);
        expect(delRes.body.message).toBe('Cannot delete account - it is in use');
        expect(delRes.body.details).toHaveProperty('transactionCount');
        expect(delRes.body.details.transactionCount).toBe(1);

        // Clean up
        await request(app)
            .delete(`/api/v1/transactions/${txnRes.body._id}`)
            .set('Authorization', `Bearer ${token}`);
    });

    test('DELETE /api/v1/accounts/:id - delete account successfully (204)', async () => {
        // Create an account specifically for deletion
        const accRes = await request(app)
            .post('/api/v1/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'To Delete', type: 'checking' });
        expect(accRes.status).toBe(201);
        const toDeleteId = accRes.body._id;

        // Delete it
        const delRes = await request(app)
            .delete(`/api/v1/accounts/${toDeleteId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(delRes.status).toBe(204);

        // Verify it's gone from list
        const listRes = await request(app)
            .get('/api/v1/accounts')
            .set('Authorization', `Bearer ${token}`);
        const deleted = listRes.body.find(c => c._id === toDeleteId);
        expect(deleted).toBeUndefined();

        // Verify get returns 404
        const getRes = await request(app)
            .get(`/api/v1/accounts/${toDeleteId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(getRes.status).toBe(404);
    });

    test('DELETE /api/v1/accounts/:id - return 404 for non-existent account', async () => {
        const fakeId = '000000000000000000000000';
        const res = await request(app)
            .delete(`/api/v1/accounts/${fakeId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    test('DELETE /api/v1/accounts/:id - require authentication', async () => {
        const res = await request(app)
            .delete(`/api/v1/accounts/${accountId}`);

        expect(res.status).toBe(401);
    });

    test('GET /api/v1/accounts - require authentication', async () => {
        const res = await request(app).get('/api/v1/accounts');
        expect(res.status).toBe(401);
    });

    test('POST /api/v1/accounts - require authentication', async () => {
        const res = await request(app).post('/api/v1/accounts').send({ name: 'Unauthorized', type: 'checking' });
        expect(res.status).toBe(401);
    });

    test('PATCH /api/v1/accounts/:id - require authentication', async () => {
        const res = await request(app).patch(`/api/v1/accounts/${accountId}`).send({ name: 'Unauthorized' });
        expect(res.status).toBe(401);
    });
});