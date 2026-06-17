const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AccountSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, required: true, index: true },
        name: { type: String, required: true, trim: true },
        type: {
            type: String,
            enum: ['checking', 'savings', 'credit', 'cash', 'investment', 'other'],
            required: true
        },
        currency: { type: String, default: 'USD' },
        balance: { type: Number, default: 0 },
        color: { type: String, default: '#10b981' }, // Default emerald
        icon: { type: String, default: 'credit-card' },
        isDefault: { type: Boolean, default: false },
        order: { type: Number, default: 0 }
    },
    { timestamps: true }
);

// Unique constraint: one account per name per user
AccountSchema.index({ userId: 1, name: 1 }, { unique: true });
// For ordering
AccountSchema.index({ userId: 1, order: 1 });

module.exports = mongoose.model('Account', AccountSchema);