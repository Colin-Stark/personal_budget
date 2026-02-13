const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Transaction = require('../../../src/models/transaction');
const { createTransaction, softDeleteTransaction } = require('../../../src/services/transactionService');

let mongo;
beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});
afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});

describe('transactionService unit-like tests', () => {
    test('createTransaction respects idempotencyKey', async () => {
        const userId = new mongoose.Types.ObjectId();
        const payload = { accountId: new mongoose.Types.ObjectId(), date: new Date(), amount: 5, idempotencyKey: 'k1' };
        const t1 = await createTransaction(userId, payload);
        const t2 = await createTransaction(userId, payload);
        expect(t1._id.toString()).toEqual(t2._id.toString());
    });

    test('createTransaction ignores non-string idempotencyKey (no injection)', async () => {
        const userId = new mongoose.Types.ObjectId();
        const payloadA = { accountId: new mongoose.Types.ObjectId(), date: new Date(), amount: 3, idempotencyKey: { $ne: 'x' } };
        const a = await createTransaction(userId, payloadA);
        const payloadB = { accountId: new mongoose.Types.ObjectId(), date: new Date(), amount: 4, idempotencyKey: { $ne: 'x' } };
        const b = await createTransaction(userId, payloadB);
        // different payloads with non-string idempotencyKey should result in distinct records
        expect(a._id.toString()).not.toEqual(b._id.toString());
    });

    test('createTransaction trims and normalizes idempotencyKey on save', async () => {
        const userId = new mongoose.Types.ObjectId();
        const payload1 = { accountId: new mongoose.Types.ObjectId(), date: new Date(), amount: 9, idempotencyKey: '  trim-me  ' };
        const payload2 = { accountId: new mongoose.Types.ObjectId(), date: new Date(), amount: 9, idempotencyKey: 'trim-me' };
        const t1 = await createTransaction(userId, payload1);
        const t2 = await createTransaction(userId, payload2);
        // normalization means these should dedupe to the same transaction
        expect(t1._id.toString()).toEqual(t2._id.toString());
        const stored = await Transaction.findById(t1._id).exec();
        expect(stored.idempotencyKey).toBe('trim-me');
    });

    test('softDeleteTransaction marks isDeleted', async () => {
        const userId = new mongoose.Types.ObjectId();
        const payload = { accountId: new mongoose.Types.ObjectId(), date: new Date(), amount: 7 };
        const tx = await createTransaction(userId, payload);
        await softDeleteTransaction(userId, tx._id);
        const found = await Transaction.findById(tx._id).exec();
        expect(found.isDeleted).toBeTruthy();
    });
});
