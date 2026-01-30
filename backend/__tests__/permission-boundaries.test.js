const request = require('supertest');
const app = require('../src/app');
const models = require('../src/models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Edge Case Testing: Permission Boundaries', () => {
  let adminToken, memberToken, viewerToken;
  let adminUser, memberUser, viewerUser;
  
  beforeEach(async () => {
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

  describe('Board Creation Permissions', () => {
    test('should allow admin to create board', async () => {
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Board', description: 'Test' });
      
      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
    });

    test('should allow member to create board', async () => {
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ title: 'Member Board', description: 'Test' });
      
      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
    });

    test('should deny viewer from creating board', async () => {
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Viewer Board', description: 'Test' });
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
      expect(response.body.error).toContain('member');
    });
  });

  describe('Board Deletion Permissions', () => {
    let memberBoard, otherMemberBoard;
    let otherMemberUser, otherMemberToken;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      otherMemberUser = await models.User.create({
        name: 'Other Member',
        email: 'other@test.com',
        password: hashedPassword,
        role: 'member'
      });
      otherMemberToken = jwt.sign({ sub: otherMemberUser._id }, process.env.JWT_SECRET || 'test-secret');

      memberBoard = await models.Board.create({
        title: 'Member Board',
        owner: memberUser._id,
        members: [otherMemberUser._id]
      });

      otherMemberBoard = await models.Board.create({
        title: 'Other Board',
        owner: otherMemberUser._id,
        members: []
      });
    });

    test('should allow owner to delete their board', async () => {
      const response = await request(app)
        .delete(`/api/boards/${memberBoard._id}`)
        .set('Authorization', `Bearer ${memberToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    test('should allow admin to delete any board', async () => {
      const response = await request(app)
        .delete(`/api/boards/${memberBoard._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    test('should deny board member (non-owner) from deleting board', async () => {
      const response = await request(app)
        .delete(`/api/boards/${memberBoard._id}`)
        .set('Authorization', `Bearer ${otherMemberToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
      expect(response.body.error).toContain('permission');
    });

    test('should deny non-member from deleting board', async () => {
      const response = await request(app)
        .delete(`/api/boards/${otherMemberBoard._id}`)
        .set('Authorization', `Bearer ${memberToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
    });

    test('should deny viewer from deleting board', async () => {
      const response = await request(app)
        .delete(`/api/boards/${memberBoard._id}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('Ticket Creation Permissions', () => {
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

    test('should allow admin to create ticket', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Ticket',
          boardId: board._id.toString(),
          columnId: column._id.toString()
        });
      
      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
    });

    test('should allow board owner to create ticket', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Owner Ticket',
          boardId: board._id.toString(),
          columnId: column._id.toString()
        });
      
      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
    });

    test('should deny viewer from creating ticket', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Viewer Ticket',
          boardId: board._id.toString(),
          columnId: column._id.toString()
        });
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
      expect(response.body.error).toContain('member');
    });

    test('should deny non-board-member from creating ticket', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const outsider = await models.User.create({
        name: 'Outsider',
        email: 'outsider@test.com',
        password: hashedPassword,
        role: 'member'
      });
      const outsiderToken = jwt.sign({ sub: outsider._id }, process.env.JWT_SECRET || 'test-secret');

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          title: 'Outsider Ticket',
          boardId: board._id.toString(),
          columnId: column._id.toString()
        });
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
      expect(response.body.error).toContain('access');
    });
  });

  describe('Ticket Modification Permissions', () => {
    let board, column, ticket;
    let otherMemberUser, otherMemberToken;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      otherMemberUser = await models.User.create({
        name: 'Other Member',
        email: 'other@test.com',
        password: hashedPassword,
        role: 'member'
      });
      otherMemberToken = jwt.sign({ sub: otherMemberUser._id }, process.env.JWT_SECRET || 'test-secret');

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

    test('should allow admin to update any ticket', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Admin update' });
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    test('should allow board owner to update ticket', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ description: 'Owner update' });
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    test('should deny viewer from updating ticket', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ description: 'Viewer update' });
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
    });

    test('should deny non-board-member from updating ticket', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${otherMemberToken}`)
        .send({ description: 'Outsider update' });
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('Ticket Deletion Permissions', () => {
    let board, column, ticket;
    let otherMemberUser, otherMemberToken;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      otherMemberUser = await models.User.create({
        name: 'Other Member',
        email: 'other@test.com',
        password: hashedPassword,
        role: 'member'
      });
      otherMemberToken = jwt.sign({ sub: otherMemberUser._id }, process.env.JWT_SECRET || 'test-secret');

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

    test('should allow admin to hard delete ticket', async () => {
      const response = await request(app)
        .delete(`/api/tickets/${ticket._id}?hardDelete=true`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      
      const deletedTicket = await models.Ticket.findById(ticket._id);
      expect(deletedTicket).toBeNull();
    });

    test('should allow board owner to soft delete ticket', async () => {
      const response = await request(app)
        .delete(`/api/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${memberToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      
      const deletedTicket = await models.Ticket.findById(ticket._id);
      expect(deletedTicket.deletedAt).not.toBeNull();
    });

    test('should deny viewer from deleting ticket', async () => {
      const response = await request(app)
        .delete(`/api/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
    });

    test('should deny non-board-member from deleting ticket', async () => {
      const response = await request(app)
        .delete(`/api/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${otherMemberToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
    });

    test('should deny member from hard deleting ticket', async () => {
      const response = await request(app)
        .delete(`/api/tickets/${ticket._id}?hardDelete=true`)
        .set('Authorization', `Bearer ${memberToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      
      // Should be soft deleted instead
      const ticket2 = await models.Ticket.findById(ticket._id);
      expect(ticket2).not.toBeNull();
      expect(ticket2.deletedAt).not.toBeNull();
    });
  });

  describe('Comment Deletion Permissions', () => {
    let board, column, ticket, comment;
    let otherMemberUser, otherMemberToken;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      otherMemberUser = await models.User.create({
        name: 'Other Member',
        email: 'other@test.com',
        password: hashedPassword,
        role: 'member'
      });
      otherMemberToken = jwt.sign({ sub: otherMemberUser._id }, process.env.JWT_SECRET || 'test-secret');

      board = await models.Board.create({
        title: 'Test Board',
        owner: memberUser._id,
        members: [otherMemberUser._id]
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

      comment = await models.Comment.create({
        ticket: ticket._id,
        author: memberUser._id,
        text: 'Test comment'
      });
    });

    test('should allow comment author to delete their comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${memberToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    test('should allow admin to delete any comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    test('should deny non-author member from deleting comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${otherMemberToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
      expect(response.body.error).toContain('Not authorized');
    });

    test('should deny viewer from deleting comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('Board Access Permissions', () => {
    let memberBoard, otherMemberUser, otherMemberToken;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      otherMemberUser = await models.User.create({
        name: 'Other Member',
        email: 'other@test.com',
        password: hashedPassword,
        role: 'member'
      });
      otherMemberToken = jwt.sign({ sub: otherMemberUser._id }, process.env.JWT_SECRET || 'test-secret');

      memberBoard = await models.Board.create({
        title: 'Member Board',
        owner: memberUser._id,
        members: []
      });
    });

    test('should allow board owner to view their board', async () => {
      const response = await request(app)
        .get(`/api/boards/${memberBoard._id}`)
        .set('Authorization', `Bearer ${memberToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    test('should allow admin to view any board', async () => {
      const response = await request(app)
        .get(`/api/boards/${memberBoard._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    test('should deny non-member from viewing board', async () => {
      const response = await request(app)
        .get(`/api/boards/${memberBoard._id}`)
        .set('Authorization', `Bearer ${otherMemberToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
      expect(response.body.error).toContain('access');
    });

    test('should allow board member to view board', async () => {
      // Add other member to board
      memberBoard.members.push(otherMemberUser._id);
      await memberBoard.save();

      const response = await request(app)
        .get(`/api/boards/${memberBoard._id}`)
        .set('Authorization', `Bearer ${otherMemberToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });
  });
});
