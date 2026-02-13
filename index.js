require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const logger = require('./src/lib/logger');

const authRoutes = require('./src/routes/auth');
const transactionRoutes = require('./src/routes/transactions');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/transactions', transactionRoutes);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/personal_budget_dev';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => logger.info(`Server listening on port ${PORT}`));
  } catch (err) {
    logger.error('Failed to start app', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;
