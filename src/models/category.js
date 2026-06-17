const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, required: true, index: true },
        name: { type: String, required: true, trim: true },
        color: { type: String, default: '#6366f1' }, // Default indigo
        icon: { type: String, default: 'wallet' }, // Default icon name
        isDefault: { type: Boolean, default: false },
        order: { type: Number, default: 0 }
    },
    { timestamps: true }
);

// Unique constraint: one category per name per user
CategorySchema.index({ userId: 1, name: 1 }, { unique: true });
// For ordering
CategorySchema.index({ userId: 1, order: 1 });

module.exports = mongoose.model('Category', CategorySchema);