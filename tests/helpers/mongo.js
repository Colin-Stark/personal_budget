require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.CI_MONGO_URI;
if (!MONGO_URI) {
    throw new Error('MONGO_URI must be set in environment (e.g. in .env)');
}

mongoose.set('debug', false);

const maskUri = (uri) => {
    try {
        return uri.replace(/(\/\/.*?:)(.*?)(@)/, '$1****$3');
    } catch {
        return '****';
    }
};

mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error (${maskUri(MONGO_URI)}):`, err);
});

module.exports = {
    start: async () => {
        if (mongoose.connection.readyState !== 0) return;
        try {
            await mongoose.connect(MONGO_URI, {
                serverSelectionTimeoutMS: 5000,
            });
        } catch (err) {
            const e = new Error(`Failed to connect to MongoDB (${maskUri(MONGO_URI)}): ${err.message}`);
            e.original = err;
            throw e;
        }
    },

    stop: async () => {
        if (mongoose.connection.readyState === 0) return;
        try {
            await mongoose.disconnect();
        } catch (err) {
            const e = new Error(`Failed to disconnect from MongoDB: ${err.message}`);
            e.original = err;
            throw e;
        }
    },
};
