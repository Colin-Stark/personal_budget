const fs = require('fs');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const request = require('supertest');
const app = require('../../index');

const spec = yaml.load(fs.readFileSync('./specs/001-budget-api/contracts/openapi.yaml', 'utf8'));
const ajv = new Ajv();

describe('Transactions contract', () => {
  test('POST /transactions returns TransactionResponse', async () => {
    await request(app).post('/api/v1/auth/register').send({ email: 'd@example.com', password: 'pw1234', displayName: 'D' });
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'd@example.com', password: 'pw1234' });
    const token = login.body.token;
    const payload = { accountId: '000000000000000000000010', date: new Date().toISOString(), amount: 12 };
    const res = await request(app).post('/api/v1/transactions').set('Authorization', `Bearer ${token}`).send(payload);
    expect(res.status).toBe(201);
    const schema = spec.components.schemas.TransactionResponse;
    const validate = ajv.compile(schema);
    expect(validate(res.body)).toBe(true);
    if (!validate(res.body)) console.error(validate.errors);
  });
});
