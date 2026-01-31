const mongoose = require('mongoose');

module.exports = async () => {
  // Disconnect from MongoDB after all tests
  try {
    await mongoose.disconnect();
    console.log('✅ Test MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
  }
};
