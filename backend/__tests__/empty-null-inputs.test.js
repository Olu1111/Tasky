const request = require('supertest');
const app = require('../src/app');
const models = require('../src/models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Edge Case Testing: Empty/Null Inputs', () => {
  let adminToken, memberToken, viewerToken;
  let adminUser, memberUser, viewerUser;
  
  beforeEach(async () => {
    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    adminUser = await models.User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin'
    });
    
    memberUser = await models.User.create({
      name: 'Member User',
      email: 'member@test.com',
      password: hashedPassword,
      role: 'member'
    });
    
    viewerUser = await models.User.create({
      name: 'Viewer User',
      email: 'viewer@test.com',
      password: hashedPassword,
      role: 'viewer'
    });
    
    adminToken = jwt.sign({ sub: adminUser._id }, process.env.JWT_SECRET || 'test-secret');
    memberToken = jwt.sign({ sub: memberUser._id }, process.env.JWT_SECRET || 'test-secret');
    viewerToken = jwt.sign({ sub: viewerUser._id }, process.env.JWT_SECRET || 'test-secret');
  });

  describe('Board Creation with Empty/Null Inputs', () => {
    test('should reject board creation with empty title', async () => {
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ title: '', description: 'Test description' });
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.error).toContain('title');
    });

    test('should reject board creation with null title', async () => {
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ title: null, description: 'Test description' });
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    test('should reject board creation with whitespace-only title', async () => {
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ title: '   ', description: 'Test description' });
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    test('should reject board creation with missing title', async () => {
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ description: 'Test description' });
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    test('should accept board creation with empty description', async () => {
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ title: 'Valid Board', description: '' });
      
      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
      expect(response.body.data.board.description).toBe('');
    });

    test('should accept board creation with null description', async () => {
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ title: 'Valid Board', description: null });
      
      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
      expect(response.body.data.board.description).toBe('');
    });
  });

  describe('Ticket Creation with Empty/Null Inputs', () => {
    let board, column;

    beforeEach(async () => {
      board = await models.Board.create({
        title: 'Test Board',
        owner: memberUser._id,
        members: []
      });

      column = await models.Column.create({
        title: 'Backlog',
        board: board._id,
        position: 0
      });
    });

    test('should reject ticket creation with empty title', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: '',
          description: 'Test description',
          boardId: board._id.toString(),
          columnId: column._id.toString()
        });
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.error).toContain('Title');
    });

    test('should reject ticket creation with null title', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: null,
          description: 'Test description',
          boardId: board._id.toString(),
          columnId: column._id.toString()
        });
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    test('should reject ticket creation with whitespace-only title', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: '   ',
          description: 'Test description',
          boardId: board._id.toString(),
          columnId: column._id.toString()
        });
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    test('should accept ticket creation with empty description', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Valid Ticket',
          description: '',
          boardId: board._id.toString(),
          columnId: column._id.toString()
        });
      
      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
      expect(response.body.data.ticket.description).toBe('');
    });

    test('should accept ticket creation with null description', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Valid Ticket',
          description: null,
          boardId: board._id.toString(),
          columnId: column._id.toString()
        });
      
      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
      expect(response.body.data.ticket.description).toBe('');
    });

    test('should trim whitespace from ticket title', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: '  Valid Ticket  ',
          description: 'Test',
          boardId: board._id.toString(),
          columnId: column._id.toString()
        });
      
      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
      expect(response.body.data.ticket.title).toBe('Valid Ticket');
    });
  });

  describe('Comment Creation with Empty/Null Inputs', () => {
    let board, column, ticket;

    beforeEach(async () => {
      board = await models.Board.create({
        title: 'Test Board',
        owner: memberUser._id,
        members: []
      });

      column = await models.Column.create({
        title: 'Backlog',
        board: board._id,
        position: 0
      });

      ticket = await models.Ticket.create({
        title: 'Test Ticket',
        board: board._id,
        column: column._id,
        createdBy: memberUser._id,
        position: 0
      });
    });

    test('should reject comment with empty text', async () => {
      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/comments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ text: '' });
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.error).toContain('required');
    });

    test('should reject comment with null text', async () => {
      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/comments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ text: null });
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    test('should reject comment with whitespace-only text', async () => {
      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/comments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ text: '   ' });
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    test('should trim whitespace from comment text', async () => {
      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/comments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ text: '  Valid comment  ' });
      
      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
      expect(response.body.data.comment.text).toBe('Valid comment');
    });
  });
});
