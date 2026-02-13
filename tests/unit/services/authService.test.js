const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { register, authenticate, refreshTokens, logout } = require('../../../src/services/authService');

let mongo;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('authService unit-like tests', () => {
  test('register and authenticate', async () => {
    const u = await register({ email: 'u1@example.com', password: 'pw1234', displayName: 'U1' });
    expect(u.email).toBe('u1@example.com');
    const res = await authenticate({ email: 'u1@example.com', password: 'pw1234' });
    expect(res).toHaveProperty('token');
    expect(res).toHaveProperty('refreshToken');
  });

  test('refreshTokens rotates token and logout invalidates', async () => {
    const res = await authenticate({ email: 'u1@example.com', password: 'pw123' });
    const oldRefresh = res.refreshToken;
    const refreshed = await refreshTokens(oldRefresh);
    expect(refreshed).toHaveProperty('token');
    expect(refreshed).toHaveProperty('refreshToken');
    // old refresh should no longer work
    await expect(refreshTokens(oldRefresh)).rejects.toThrow();
    // logout with current refresh token
    await logout(refreshed.refreshToken);
    await expect(refreshTokens(refreshed.refreshToken)).rejects.toThrow();
  });
});
