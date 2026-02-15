// Test environment setup: ensure JWT secret exists for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
