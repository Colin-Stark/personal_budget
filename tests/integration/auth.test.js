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
