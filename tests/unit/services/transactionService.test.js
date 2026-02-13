const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Transaction = require('../../../src/models/transaction');
const { createTransaction, listTransactions, softDeleteTransaction } = require('../../../src/services/transactionService');

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

  test('softDeleteTransaction marks isDeleted', async () => {
    const userId = new mongoose.Types.ObjectId();
    const payload = { accountId: new mongoose.Types.ObjectId(), date: new Date(), amount: 7 };
    const tx = await createTransaction(userId, payload);
    await softDeleteTransaction(userId, tx._id);
    const found = await Transaction.findById(tx._id).exec();
    expect(found.isDeleted).toBeTruthy();
  });
});
