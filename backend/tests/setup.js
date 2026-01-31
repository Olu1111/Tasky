const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Set environment variables for tests BEFORE anything else
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-12345';
process.env.JWT_EXPIRES_IN = '24h';
process.env.PORT = '5000';

// Test setup - runs before all tests
jest.setTimeout(60000);

// Start in-memory MongoDB for tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set MongoDB URI for this test session
  process.env.MONGODB_URI = mongoUri;
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
  }
}, 30000);

// NOTE: Removing afterEach cleanup - tests within a suite should preserve data
// Only clean between different test suites, not between tests

// Disconnect after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 10000);
