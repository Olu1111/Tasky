#!/usr/bin/env node

// Seed runner script
// Usage: node backend/src/seed/seedRunner.js [option]
// Options: all | clear | inject

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const { injectAllBoards, clearAndInjectTickets } = require('./ticketSeeder');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tasky';

const runSeeder = async () => {
  try {
    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const option = process.argv[2] || 'inject';

    if (option === 'clear') {
      console.log('This will DELETE all existing tickets and recreate them.');
      await clearAndInjectTickets();
    } else if (option === 'inject') {
      console.log('This will inject 100 tickets into each existing board.');
      await injectAllBoards();
    } else if (option === 'all') {
      console.log('This will clear all tickets and inject fresh ones.');
      await clearAndInjectTickets();
    } else {
      console.log('Usage: node seedRunner.js [option]');
      console.log('Options:');
      console.log('  inject (default) - Add 100 tickets to each existing board');
      console.log('  clear            - Clear existing tickets and inject fresh ones');
      console.log('  all              - Same as clear');
    }

    console.log('✨ Done!\n');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
};

// Run the seeder
runSeeder();
