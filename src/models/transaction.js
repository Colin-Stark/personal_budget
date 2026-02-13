const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, required: true, index: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    categoryId: { type: Schema.Types.ObjectId },
    description: { type: String },
    metadata: { type: Schema.Types.Mixed },
    idempotencyKey: { type: String, index: true, sparse: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId }
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
TransactionSchema.index({ userId: 1, accountId: 1, date: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
