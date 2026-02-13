const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../index');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Budgets', () => {
  let token;
  beforeAll(async () => {
    await request(app).post('/api/v1/auth/register').send({ email: 'bgt@example.com', password: 'pw1234', displayName: 'B' });
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'bgt@example.com', password: 'pw1234' });
    token = res.body.token;
  });

  test('create and list budget', async () => {
    const payload = { categoryId: '000000000000000000000011', month: '2026-02', amount: 500 };
    const r = await request(app).post('/api/v1/budgets').set('Authorization', `Bearer ${token}`).send(payload);
    expect(r.status).toBe(201);
    const list = await request(app).get('/api/v1/budgets').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.length).toBeGreaterThan(0);
  });
});
