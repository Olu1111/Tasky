// Seed utility to inject random tickets into boards
// Generates 100 tickets per board with realistic data

const mongoose = require('mongoose');

// Random data generators
const ADJECTIVES = [
  'Fix', 'Implement', 'Add', 'Update', 'Improve', 'Refactor', 'Optimize',
  'Debug', 'Document', 'Enhance', 'Resolve', 'Create', 'Review', 'Test',
  'Migrate', 'Cleanup', 'Validate', 'Authenticate', 'Authorize', 'Cache',
  'Monitor', 'Scale', 'Secure', 'Localize', 'Backup', 'Archive'
];

const FEATURES = [
  'login',
  'authentication',
  'password reset',
  'user profile',
  'dashboard',
  'payment processing',
  'email notifications',
  'search functionality',
  'file upload',
  'data export',
  'dark mode',
  'notifications',
  'API integration',
  'database connection',
  'error handling',
  'form validation',
  'mobile responsiveness',
  'performance',
  'accessibility',
  'security',
  'caching',
  'sorting',
  'filtering',
  'pagination',
  'export',
  'import',
  'backup',
  'recovery',
  'logging',
  'monitoring'
];

const PRIORITIES = ['High', 'Medium', 'Low'];

const STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'];

/**
 * Generate random ticket title
 */
const generateRandomTitle = () => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const feature = FEATURES[Math.floor(Math.random() * FEATURES.length)];
  return `${adj} ${feature}`;
};

/**
 * Generate random description
 */
const generateRandomDescription = () => {
  const descriptions = [
    'This needs to be completed as soon as possible.',
    'Follow best practices and add proper error handling.',
    'Ensure all tests pass before merging.',
    'Review the requirements document before starting.',
    'Add comprehensive documentation.',
    'Consider performance implications.',
    'Update changelog when complete.',
    'Request review from team lead.',
    'Test in staging environment first.',
    'Add unit tests for this feature.',
    'Update API documentation.',
    'Consider edge cases.',
    'Monitor performance metrics.',
    'Add logging for debugging.',
    'Verify with product team.'
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

/**
 * Generate random priority
 */
const getRandomPriority = () => {
  return PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
};

/**
 * Generate random status
 */
const getRandomStatus = () => {
  return STATUSES[Math.floor(Math.random() * STATUSES.length)];
};

/**
 * Inject 100 random tickets into a board
 */
const injectTicketsIntoBoard = async (board, Board, Column, Ticket, User) => {
  console.log(`\n📋 Injecting tickets into board: "${board.title}"`);

  try {
    // Get or create columns for the board
    let columns = await Column.find({ board: board._id });

    if (columns.length === 0) {
      console.log('   Creating default columns...');
      const defaultColumns = ['To Do', 'In Progress', 'In Review', 'Done'];
      columns = [];

      for (const colTitle of defaultColumns) {
        const column = new Column({
          board: board._id,
          title: colTitle,
          position: columns.length
        });
        await column.save();
        columns.push(column);
      }
    }

    // Get available users for assignment
    const users = await User.find();
    if (users.length === 0) {
      throw new Error('No users found in database. Please create users first.');
    }
    const userIds = users.map(u => u._id);

    // Generate 100 tickets
    const tickets = [];
    for (let i = 0; i < 100; i++) {
      const columnIndex = Math.floor(Math.random() * columns.length);
      const column = columns[columnIndex];

      // Randomly assign to a user (70% chance) or leave unassigned
      const assigneeId = Math.random() < 0.7 ? userIds[Math.floor(Math.random() * userIds.length)] : null;
      const creatorId = userIds[Math.floor(Math.random() * userIds.length)];

      const ticket = new Ticket({
        board: board._id,
        column: column._id,
        title: generateRandomTitle(),
        description: generateRandomDescription(),
        priority: getRandomPriority(),
        status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
        assignee: assigneeId,
        createdBy: creatorId,
        position: i,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in past 30 days
      });

      await ticket.save();
      tickets.push(ticket);

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        process.stdout.write(`   ✓ ${i + 1}/100 tickets created\r`);
      }
    }

    console.log(`   ✅ Successfully injected 100 tickets\n`);
    return tickets;
  } catch (error) {
    console.error(`   ❌ Error injecting tickets: ${error.message}`);
    throw error;
  }
};

/**
 * Recursively inject tickets into all boards
 */
const injectAllBoards = async () => {
  try {
    const Board = require('../models/Board');
    const Column = require('../models/Column');
    const Ticket = require('../models/Ticket');
    const User = require('../models/User');

    // Get all boards
    const boards = await Board.find();

    if (boards.length === 0) {
      console.log('No boards found. Create boards first.');
      return;
    }

    console.log(`\n🚀 Starting ticket injection into ${boards.length} board(s)\n`);

    let totalTickets = 0;

    // Inject tickets into each board recursively
    for (const board of boards) {
      const tickets = await injectTicketsIntoBoard(board, Board, Column, Ticket, User);
      totalTickets += tickets.length;
    }

    console.log(`\n✨ Injection complete!`);
    console.log(`📊 Total tickets created: ${totalTickets}`);
    console.log(`📈 Average per board: ${Math.round(totalTickets / boards.length)}\n`);

    return totalTickets;
  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  }
};

/**
 * Clear existing tickets and inject fresh ones
 */
const clearAndInjectTickets = async () => {
  try {
    const Ticket = require('../models/Ticket');
    const Column = require('../models/Column');

    console.log('\n🗑️  Clearing existing tickets...');
    await Ticket.deleteMany({});
    console.log('✅ Tickets cleared\n');

    return await injectAllBoards();
  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  }
};

module.exports = {
  generateRandomTitle,
  generateRandomDescription,
  getRandomPriority,
  getRandomStatus,
  injectTicketsIntoBoard,
  injectAllBoards,
  clearAndInjectTickets
};
