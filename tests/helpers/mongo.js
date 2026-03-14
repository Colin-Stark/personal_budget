const mongoose = require('mongoose');

const DEFAULT_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/personal_budget_test';

module.exports = {
    start: async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(DEFAULT_URI);
        }
    },
    stop: async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    },
};
