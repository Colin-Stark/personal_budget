const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../index');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Auth', () => {
  test('register -> login flow', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({ email: 'a@example.com', password: 'pass123', displayName: 'A' });
    expect(reg.status).toBe(201);

    const login = await request(app).post('/api/v1/auth/login').send({ email: 'a@example.com', password: 'pass123' });
    expect(login.status).toBe(200);
    expect(login.body).toHaveProperty('token');
  });
});
