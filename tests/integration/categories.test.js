const request = require('supertest');
const mongo = require('../helpers/mongo');
const app = require('../../server');

beforeAll(async () => {
    await mongo.start();
});

afterAll(async () => {
    const User = require('../../src/models/user');
    const Category = require('../../src/models/category');
    const Budget = require('../../src/models/budget');
    const Transaction = require('../../src/models/transaction');
    try {
        const user = await User.findOne({ email: 'cat@example.com' }).exec();
        if (user) {
            // Clean up in reverse dependency order
            await Transaction.deleteMany({ userId: user._id });
            await Budget.deleteMany({ userId: user._id });
            await Category.deleteMany({ userId: user._id });
            await User.deleteOne({ _id: user._id });
        }
    } catch (e) {
        // ignore cleanup errors
    } finally {
        await mongo.stop();
    }
});

describe('Categories CRUD', () => {
    let token;
    let categoryId;

    beforeAll(async () => {
        // Register and login a test user
        await request(app).post('/api/v1/auth/register').send({ email: 'cat@example.com', password: 'pw1234', displayName: 'Cat User' });
        const res = await request(app).post('/api/v1/auth/login').send({ email: 'cat@example.com', password: 'pw1234' });
        token = res.body.token;
    });

    test('POST /api/v1/categories - create category (should return _id)', async () => {
        const payload = {
            name: 'Groceries',
            color: '#10b981',
            icon: 'shopping-cart',
            isDefault: false,
            order: 1
        };
        const res = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.name).toBe('Groceries');
        expect(res.body.color).toBe('#10b981');
        expect(res.body.icon).toBe('shopping-cart');
        expect(res.body.isDefault).toBe(false);
        expect(res.body.order).toBe(1);
        expect(res.body).toHaveProperty('createdAt');
        expect(res.body).toHaveProperty('updatedAt');

        // Store the category ID for subsequent tests
        categoryId = res.body._id;
    });

    test('POST /api/v1/categories - create category with defaults (minimal payload)', async () => {
        const payload = { name: 'Entertainment' };
        const res = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.name).toBe('Entertainment');
        expect(res.body.color).toBe('#6366f1'); // default color
        expect(res.body.icon).toBe('wallet'); // default icon
        expect(res.body.isDefault).toBe(false); // default
        expect(res.body.order).toBe(0); // default
    });

    test('POST /api/v1/categories - reject duplicate category name for same user', async () => {
        const payload = { name: 'Groceries' }; // Already created above
        const res = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('Category with this name already exists');
    });

    test('POST /api/v1/categories - reject missing required name field', async () => {
        const payload = { color: '#ff0000' };
        const res = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(400);
    });

    test('POST /api/v1/categories - reject invalid color format', async () => {
        const payload = { name: 'Invalid Color', color: 'not-a-hex-color' };
        const res = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(400);
    });

    test('POST /api/v1/categories - reject name exceeding max length', async () => {
        const payload = { name: 'a'.repeat(51) }; // max is 50
        const res = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(400);
    });

    test('GET /api/v1/categories - list categories (should include created ones)', async () => {
        const res = await request(app)
            .get('/api/v1/categories')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(2); // Groceries + Entertainment

        const groceries = res.body.find(c => c.name === 'Groceries');
        expect(groceries).toBeDefined();
        expect(groceries.color).toBe('#10b981');
        expect(groceries.icon).toBe('shopping-cart');
    });

    test('GET /api/v1/categories/:id - get single category', async () => {
        const res = await request(app)
            .get(`/api/v1/categories/${categoryId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body._id).toBe(categoryId);
        expect(res.body.name).toBe('Groceries');
        expect(res.body.color).toBe('#10b981');
    });

    test('GET /api/v1/categories/:id - return 404 for non-existent category', async () => {
        const fakeId = '000000000000000000000000';
        const res = await request(app)
            .get(`/api/v1/categories/${fakeId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Not found');
    });

    test('GET /api/v1/categories/:id - return 404 for category belonging to another user', async () => {
        // Create another user and category
        const uniqueEmail = `cat2_${Date.now()}@example.com`;
        await request(app).post('/api/v1/auth/register').send({ email: uniqueEmail, password: 'pw1234', displayName: 'Cat User 2' });
        const login2 = await request(app).post('/api/v1/auth/login').send({ email: uniqueEmail, password: 'pw1234' });
        const token2 = login2.body.token;

        const createRes = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', `Bearer ${token2}`)
            .send({ name: 'Other User Category' });
        expect(createRes.status).toBe(201);
        const otherCategoryId = createRes.body._id;

        // Try to access it with first user's token
        const res = await request(app)
            .get(`/api/v1/categories/${otherCategoryId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    test('PATCH /api/v1/categories/:id - update category name and color', async () => {
        const payload = { name: 'Supermarket', color: '#f59e0b' };
        const res = await request(app)
            .patch(`/api/v1/categories/${categoryId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body._id).toBe(categoryId);
        expect(res.body.name).toBe('Supermarket');
        expect(res.body.color).toBe('#f59e0b');
        expect(res.body.icon).toBe('shopping-cart'); // unchanged
    });

    test('PATCH /api/v1/categories/:id - update only icon', async () => {
        const payload = { icon: 'cart' };
        const res = await request(app)
            .patch(`/api/v1/categories/${categoryId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.icon).toBe('cart');
        expect(res.body.name).toBe('Supermarket'); // unchanged from previous update
    });

    test('PATCH /api/v1/categories/:id - update isDefault and order', async () => {
        const payload = { isDefault: true, order: 5 };
        const res = await request(app)
            .patch(`/api/v1/categories/${categoryId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.isDefault).toBe(true);
        expect(res.body.order).toBe(5);
    });

    test('PATCH /api/v1/categories/:id - reject empty update payload', async () => {
        const res = await request(app)
            .patch(`/api/v1/categories/${categoryId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
    });

    test('PATCH /api/v1/categories/:id - reject duplicate name update', async () => {
        // First create another category
        const createRes = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Transport' });
        expect(createRes.status).toBe(201);

        // Try to update existing category to have the same name
        const res = await request(app)
            .patch(`/api/v1/categories/${categoryId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Transport' });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('Category with this name already exists');
    });

    test('PATCH /api/v1/categories/:id - return 404 for non-existent category', async () => {
        const fakeId = '000000000000000000000000';
        const res = await request(app)
            .patch(`/api/v1/categories/${fakeId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'New Name' });

        expect(res.status).toBe(404);
    });

    test('DELETE /api/v1/categories/:id - fail to delete category in use by budget (409)', async () => {
        // Create a category to use with budget
        const catRes = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Budget Category' });
        expect(catRes.status).toBe(201);
        const budgetCategoryId = catRes.body._id;

        // Create a budget using this category
        const budgetRes = await request(app)
            .post('/api/v1/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send({ categoryId: budgetCategoryId, month: '2026-06', amount: 100 });
        expect(budgetRes.status).toBe(201);

        // Try to delete the category - should fail with 409
        const delRes = await request(app)
            .delete(`/api/v1/categories/${budgetCategoryId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(delRes.status).toBe(409);
        expect(delRes.body.message).toBe('Cannot delete category - it is in use');
        expect(delRes.body.details).toHaveProperty('budgetCount');
        expect(delRes.body.details.budgetCount).toBe(1);

        // Clean up - delete the budget first, then the category
        await request(app)
            .delete(`/api/v1/budgets/${budgetRes.body._id}`)
            .set('Authorization', `Bearer ${token}`);
    });

    test('DELETE /api/v1/categories/:id - fail to delete category in use by transaction (409)', async () => {
        // Increase timeout for this test
        jest.setTimeout(15000);
        // Use a hardcoded valid ObjectId for accountId (like transactions tests do)
        const accountId = '000000000000000000000001';

        // Create a category to use with transaction
        const catRes = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Transaction Category' });
        expect(catRes.status).toBe(201);
        const transactionCategoryId = catRes.body._id;

        // Create a transaction using this category
        const txnRes = await request(app)
            .post('/api/v1/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({
                accountId,
                categoryId: transactionCategoryId,
                date: new Date().toISOString(),
                amount: 50
            });
        expect(txnRes.status).toBe(201);

        // Try to delete the category - should fail with 409
        const delRes = await request(app)
            .delete(`/api/v1/categories/${transactionCategoryId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(delRes.status).toBe(409);
        expect(delRes.body.message).toBe('Cannot delete category - it is in use');
        expect(delRes.body.details).toHaveProperty('transactionCount');
        expect(delRes.body.details.transactionCount).toBe(1);

        // Clean up
        await request(app)
            .delete(`/api/v1/transactions/${txnRes.body._id}`)
            .set('Authorization', `Bearer ${token}`);
    });

    test('DELETE /api/v1/categories/:id - delete category successfully (204)', async () => {
        // Create a category specifically for deletion
        const catRes = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'To Delete' });
        expect(catRes.status).toBe(201);
        const toDeleteId = catRes.body._id;

        // Delete it
        const delRes = await request(app)
            .delete(`/api/v1/categories/${toDeleteId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(delRes.status).toBe(204);

        // Verify it's gone from list
        const listRes = await request(app)
            .get('/api/v1/categories')
            .set('Authorization', `Bearer ${token}`);
        const deleted = listRes.body.find(c => c._id === toDeleteId);
        expect(deleted).toBeUndefined();

        // Verify get returns 404
        const getRes = await request(app)
            .get(`/api/v1/categories/${toDeleteId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(getRes.status).toBe(404);
    });

    test('DELETE /api/v1/categories/:id - return 404 for non-existent category', async () => {
        const fakeId = '000000000000000000000000';
        const res = await request(app)
            .delete(`/api/v1/categories/${fakeId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    test('DELETE /api/v1/categories/:id - require authentication', async () => {
        const res = await request(app)
            .delete(`/api/v1/categories/${categoryId}`);

        expect(res.status).toBe(401);
    });

    test('GET /api/v1/categories - require authentication', async () => {
        const res = await request(app).get('/api/v1/categories');
        expect(res.status).toBe(401);
    });

    test('POST /api/v1/categories - require authentication', async () => {
        const res = await request(app).post('/api/v1/categories').send({ name: 'Unauthorized' });
        expect(res.status).toBe(401);
    });

    test('PATCH /api/v1/categories/:id - require authentication', async () => {
        const res = await request(app).patch(`/api/v1/categories/${categoryId}`).send({ name: 'Unauthorized' });
        expect(res.status).toBe(401);
    });
});