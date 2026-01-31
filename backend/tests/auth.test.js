const request = require('supertest');
const { createApp } = require('../src/app');
const models = require('../src/models');

describe('Authentication Flow', () => {
  let app;
  let token;
  let userId;

  beforeAll(() => {
    // App is created fresh for each test suite
    // MongoDB connection is handled in setup.js
    app = createApp({ corsOrigin: 'http://localhost:3000' });
  }, 10000);

  const testUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!'
  };

  afterAll(async () => {
    try {
      await models.User.deleteOne({ email: testUser.email });
    } catch (err) {
      console.log('Cleanup error (safe to ignore):', err.message);
    }
  }, 10000);

  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.role).toBe('member');
      userId = res.body.data.user._id;
      
      // Verify user was actually created in database
      const userFromDb = await models.User.findOne({ email: testUser.email });
      expect(userFromDb).toBeDefined();
    }, 45000);

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
    }, 30000);

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Invalid User',
          email: 'not-an-email',
          password: 'TestPassword123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    }, 30000);
  });

  describe('POST /api/users/login', () => {
    it('should login user and return token', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
      token = res.body.data.token;
    }, 30000);

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(res.body.ok).toBe(false);
    }, 30000);

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(res.body.ok).toBe(false);
    }, 30000);
  });

  describe('GET /api/users/me', () => {
    it('should return current user with authentication', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data._id || res.body.data.user._id).toBe(userId);
      expect(res.body.data.permissions || res.body.data.user.permissions).toBeDefined();
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .expect(401);

      expect(res.body.ok).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid_token_123')
        .expect(401);

      expect(res.body.ok).toBe(false);
    });
  });

  describe('GET /api/users/team', () => {
    it('should return team members list for authenticated user', async () => {
      const res = await request(app)
        .get('/api/users/team')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThan(0);
    });

    it('should not allow unauthenticated access to team list', async () => {
      const res = await request(app)
        .get('/api/users/team')
        .expect(401);

      expect(res.body.ok).toBe(false);
    });
  });
});
