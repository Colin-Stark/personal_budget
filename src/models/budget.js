const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BudgetSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, required: true, index: true },
        categoryId: { type: Schema.Types.ObjectId, required: true },
        month: { type: String, required: true }, // YYYY-MM
        amount: { type: Number, required: true }
    },
    { timestamps: true }
);

BudgetSchema.index({ userId: 1, categoryId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', BudgetSchema);
