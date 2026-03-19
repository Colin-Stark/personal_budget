// Test environment setup: require JWT secret for tests (no fallback)
require('dotenv').config();
// Accept either JWT_SECRET or CI_JWT_SECRET (CI may inject the secret under a different name)
const jwtSecret = process.env.JWT_SECRET || process.env.CI_JWT_SECRET;
if (!jwtSecret) {
    throw new Error('JWT_SECRET must be set in environment for tests');
}
// ensure downstream code sees `JWT_SECRET`
process.env.JWT_SECRET = jwtSecret;
// Accept MONGO_URI or CI_MONGO_URI (CI may inject the URI under a different name)
const mongoUri = process.env.MONGO_URI || process.env.CI_MONGO_URI;
if (!mongoUri) {
    throw new Error('MONGO_URI must be set in environment for tests');
}
process.env.MONGO_URI = mongoUri;
