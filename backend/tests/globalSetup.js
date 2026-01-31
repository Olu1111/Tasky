const mongoose = require('mongoose');
require('dotenv').config();

module.exports = async () => {
  // Connect to MongoDB for testing
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tasky-test', {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    console.log('✅ Test MongoDB connection established');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    throw error;
  }
};
