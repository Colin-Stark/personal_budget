const mongoose = require('mongoose');
const app = require('../index');

let connecting = false;
let connected = false;

async function ensureConnected() {
  if (connected) return;
  if (connecting) {
    // wait for in-flight connection (up to 10s)
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (connected) return;
    }
    throw new Error('MongoDB connection timed out');
  }
  connecting = true;
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGO_URI is not set');
    await mongoose.connect(uri);
    connected = true;
    connecting = false;
    console.log('MongoDB connected (serverless)');
  } catch (err) {
    connecting = false;
    console.error('MongoDB connection failed:', err.message);
    throw err;
  }
}

module.exports = async (req, res) => {
  try {
    if (!connected) await ensureConnected();
  } catch (err) {
    return res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
  app(req, res);
};
