/**
 * Edge Case Testing: Empty/Null Input Validation
 * 
 * These tests verify that the application properly handles empty, null, and whitespace inputs
 * for critical fields like titles and descriptions across boards, tickets, and comments.
 */

const models = require('../src/models');

describe('Empty/Null Input Validation - Model Schema Tests', () => {
  describe('Board Model Validation', () => {
    test('should require title field', async () => {
      const board = new models.Board({
        owner: '507f1f77bcf86cd799439011' // Valid ObjectId
        // title intentionally missing
      });
      
      let error;
      try {
        await board.validate();
      } catch (e) {
        error = e;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    test('should reject empty string title', async () => {
      const board = new models.Board({
        title: '',
        owner: '507f1f77bcf86cd799439011'
      });
      
      let error;
      try {
        await board.validate();
      } catch (e) {
        error = e;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    test('should trim whitespace from title', () => {
      const board = new models.Board({
        title: '  Test Board  ',
        owner: '507f1f77bcf86cd799439011'
      });
      
      expect(board.title).toBe('Test Board');
    });

    test('should allow empty description', () => {
      const board = new models.Board({
        title: 'Test Board',
        description: '',
        owner: '507f1f77bcf86cd799439011'
      });
      
      expect(board.description).toBe('');
    });

    test('should default description to empty string when not provided', () => {
      const board = new models.Board({
        title: 'Test Board',
        owner: '507f1f77bcf86cd799439011'
      });
      
      expect(board.description).toBe('');
    });
  });

  describe('Ticket Model Validation', () => {
    test('should require title field', async () => {
      const ticket = new models.Ticket({
        board: '507f1f77bcf86cd799439011',
        column: '507f1f77bcf86cd799439011',
        createdBy: '507f1f77bcf86cd799439011'
        // title intentionally missing
      });
      
      let error;
      try {
        await ticket.validate();
      } catch (e) {
        error = e;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    test('should reject empty string title', async () => {
      const ticket = new models.Ticket({
        title: '',
        board: '507f1f77bcf86cd799439011',
        column: '507f1f77bcf86cd799439011',
        createdBy: '507f1f77bcf86cd799439011'
      });
      
      let error;
      try {
        await ticket.validate();
      } catch (e) {
        error = e;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    test('should trim whitespace from title', () => {
      const ticket = new models.Ticket({
        title: '  Test Ticket  ',
        board: '507f1f77bcf86cd799439011',
        column: '507f1f77bcf86cd799439011',
        createdBy: '507f1f77bcf86cd799439011'
      });
      
      expect(ticket.title).toBe('Test Ticket');
    });

    test('should enforce maximum title length of 100 characters', async () => {
      const longTitle = 'a'.repeat(101);
      const ticket = new models.Ticket({
        title: longTitle,
        board: '507f1f77bcf86cd799439011',
        column: '507f1f77bcf86cd799439011',
        createdBy: '507f1f77bcf86cd799439011'
      });
      
      let error;
      try {
        await ticket.validate();
      } catch (e) {
        error = e;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
      expect(error.errors.title.message).toContain('100 characters');
    });

    test('should allow empty description', () => {
      const ticket = new models.Ticket({
        title: 'Test Ticket',
        description: '',
        board: '507f1f77bcf86cd799439011',
        column: '507f1f77bcf86cd799439011',
        createdBy: '507f1f77bcf86cd799439011'
      });
      
      expect(ticket.description).toBe('');
    });

    test('should default description to empty string when not provided', () => {
      const ticket = new models.Ticket({
        title: 'Test Ticket',
        board: '507f1f77bcf86cd799439011',
        column: '507f1f77bcf86cd799439011',
        createdBy: '507f1f77bcf86cd799439011'
      });
      
      expect(ticket.description).toBe('');
    });

    test('should enforce maximum description length of 1000 characters', async () => {
      const longDescription = 'a'.repeat(1001);
      const ticket = new models.Ticket({
        title: 'Test Ticket',
        description: longDescription,
        board: '507f1f77bcf86cd799439011',
        column: '507f1f77bcf86cd799439011',
        createdBy: '507f1f77bcf86cd799439011'
      });
      
      let error;
      try {
        await ticket.validate();
      } catch (e) {
        error = e;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.description).toBeDefined();
      expect(error.errors.description.message).toContain('1000 characters');
    });

    test('should allow null assignee (unassigned ticket)', () => {
      const ticket = new models.Ticket({
        title: 'Test Ticket',
        board: '507f1f77bcf86cd799439011',
        column: '507f1f77bcf86cd799439011',
        createdBy: '507f1f77bcf86cd799439011',
        assignee: null
      });
      
      expect(ticket.assignee).toBeNull();
    });

    test('should enforce valid priority values', async () => {
      const ticket = new models.Ticket({
        title: 'Test Ticket',
        priority: 'Invalid',
        board: '507f1f77bcf86cd799439011',
        column: '507f1f77bcf86cd799439011',
        createdBy: '507f1f77bcf86cd799439011'
      });
      
      let error;
      try {
        await ticket.validate();
      } catch (e) {
        error = e;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.priority).toBeDefined();
      expect(error.errors.priority.message).toContain('Low, Medium, or High');
    });

    test('should default priority to Medium', () => {
      const ticket = new models.Ticket({
        title: 'Test Ticket',
        board: '507f1f77bcf86cd799439011',
        column: '507f1f77bcf86cd799439011',
        createdBy: '507f1f77bcf86cd799439011'
      });
      
      expect(ticket.priority).toBe('Medium');
    });

    test('should enforce non-negative position', async () => {
      const ticket = new models.Ticket({
        title: 'Test Ticket',
        position: -1,
        board: '507f1f77bcf86cd799439011',
        column: '507f1f77bcf86cd799439011',
        createdBy: '507f1f77bcf86cd799439011'
      });
      
      let error;
      try {
        await ticket.validate();
      } catch (e) {
        error = e;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.position).toBeDefined();
      expect(error.errors.position.message).toContain('cannot be negative');
    });
  });

  describe('User Model Validation', () => {
    test('should require name field', async () => {
      const user = new models.User({
        email: 'test@example.com',
        password: 'password123'
        // name intentionally missing
      });
      
      let error;
      try {
        await user.validate();
      } catch (e) {
        error = e;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
    });

    test('should require email field', async () => {
      const user = new models.User({
        name: 'Test User',
        password: 'password123'
        // email intentionally missing
      });
      
      let error;
      try {
        await user.validate();
      } catch (e) {
        error = e;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    test('should trim whitespace from name', () => {
      const user = new models.User({
        name: '  Test User  ',
        email: 'test@example.com',
        password: 'password123'
      });
      
      expect(user.name).toBe('Test User');
    });

    test('should convert email to lowercase', () => {
      const user = new models.User({
        name: 'Test User',
        email: 'Test@EXAMPLE.COM',
        password: 'password123'
      });
      
      expect(user.email).toBe('test@example.com');
    });

    test('should default role to member', () => {
      const user = new models.User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      
      expect(user.role).toBe('member');
    });

    test('should enforce valid role values', async () => {
      const user = new models.User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'invalid'
      });
      
      let error;
      try {
        await user.validate();
      } catch (e) {
        error = e;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.role).toBeDefined();
    });
  });
});
