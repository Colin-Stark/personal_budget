const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, index: true },
        displayName: { type: String },
        passwordHash: { type: String, required: true },
        refreshTokenHash: { type: String } // hashed refresh token for session management (optional)
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
