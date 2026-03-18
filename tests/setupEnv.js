// Test environment setup: require JWT secret for tests (no fallback)
require('dotenv').config();
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in environment for tests');
}
