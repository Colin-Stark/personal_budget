const fs = require('fs');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const request = require('supertest');
const app = require('../../index');

const spec = yaml.load(fs.readFileSync('./specs/001-budget-api/contracts/openapi.yaml', 'utf8'));
const ajv = new Ajv();

describe('Auth contract', () => {
  test('login response matches OpenAPI AuthResponse schema', async () => {
    await request(app).post('/api/v1/auth/register').send({ email: 'c@example.com', password: 'pw1234', displayName: 'C' });
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'c@example.com', password: 'pw1234' });
    expect(res.status).toBe(200);
    const schema = spec.components.schemas.AuthResponse;
    const validate = ajv.compile(schema);
    expect(validate(res.body)).toBe(true);
    if (!validate(res.body)) console.error(validate.errors);
  });
});
