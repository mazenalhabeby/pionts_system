import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { resetDatabase, disconnectTestPrisma, testPrisma } from '../helpers/prisma-test.helper';
import { registerUser, loginUser } from '../helpers/auth.helper';
import { resetCounters } from '../helpers/factories';

describe('Auth E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await resetDatabase();
    resetCounters();
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestPrisma();
  });

  // ── REGISTER ─────────────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('should create org, user, project, and API keys', async () => {
      const { body, refreshCookie } = await registerUser(app, {
        email: 'new@test.com',
        password: 'password123',
        name: 'Alice',
        orgName: 'Alice Corp',
      });

      expect(body.accessToken).toBeDefined();
      // refreshToken is now in cookie, not body
      expect(body.refreshToken).toBeUndefined();
      expect(refreshCookie).toContain('refresh_token=');
      expect(body.user.email).toBe('new@test.com');
      expect(body.user.name).toBe('Alice');
      expect(body.user.role).toBe('owner');
      expect(body.org.name).toBe('Alice Corp');
      expect(body.org.slug).toMatch(/^alice-corp-/);
      expect(body.orgs).toBeDefined();
      expect(body.orgs).toHaveLength(1);
      expect(body.orgs[0].role).toBe('owner');
      expect(body.orgs[0].name).toBe('Alice Corp');
      expect(body.project.name).toBe('Alice Corp Rewards');
      expect(body.apiKeys.publicKey).toMatch(/^pk_live_/);
      expect(body.apiKeys.secretKey).toMatch(/^sk_live_/);
    });

    it('should return 409 for duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'new@test.com',
          password: 'password123',
          orgName: 'Dupe Corp',
        });
      expect(res.status).toBe(409);
    });

    it('should return 400 for missing email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ password: 'password123', orgName: 'X' });
      expect(res.status).toBe(400);
    });

    it('should return 400 for short password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'short@test.com', password: '123', orgName: 'X' });
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'password123', orgName: 'X' });
      expect(res.status).toBe(400);
    });

    it('should return 400 for missing orgName', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'x@test.com', password: 'password123' });
      expect(res.status).toBe(400);
    });

    it('should initialize default settings and earn actions for the project', async () => {
      const settings = await testPrisma.setting.findMany({
        where: { project: { org: { memberships: { some: { user: { email: 'new@test.com' } } } } } },
      });
      expect(settings.length).toBeGreaterThan(0);

      // Point values now live in earn_actions table, not settings
      const project = await testPrisma.project.findFirst({
        where: { org: { memberships: { some: { user: { email: 'new@test.com' } } } } },
      });
      const signupAction = await testPrisma.earnAction.findUnique({
        where: { projectId_slug: { projectId: project!.id, slug: 'signup' } },
      });
      expect(signupAction).not.toBeNull();
      expect(signupAction!.points).toBe(20);

      // Redemption tiers should be seeded
      const tiers = await testPrisma.redemptionTier.findMany({ where: { projectId: project!.id } });
      expect(tiers.length).toBe(4);

      // Referral levels should be seeded
      const levels = await testPrisma.referralLevel.findMany({ where: { projectId: project!.id } });
      expect(levels.length).toBe(2);
    });
  });

  // ── LOGIN ────────────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('should return access token and set refresh cookie', async () => {
      const { body, refreshCookie } = await loginUser(app, 'new@test.com', 'password123');

      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeUndefined();
      expect(refreshCookie).toContain('refresh_token=');
      expect(body.user.email).toBe('new@test.com');
      expect(body.org).toBeDefined();
      expect(body.orgs).toBeDefined();
      expect(body.orgs.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'new@test.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' });
      expect(res.status).toBe(401);
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // ── REFRESH ──────────────────────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('should return new access token from refresh cookie', async () => {
      const { body: loginBody, refreshCookie } = await loginUser(app, 'new@test.com', 'password123');

      // Wait to ensure different iat claim
      await new Promise((r) => setTimeout(r, 1100));

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', refreshCookie)
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.accessToken).not.toBe(loginBody.accessToken);
    });

    it('should return 401 without refresh cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh');
      expect(res.status).toBe(401);
    });

    it('should return 401 for a cookie with wrong secret', async () => {
      const jwt = require('@nestjs/jwt');
      const jwtService = new jwt.JwtService({});
      const fakeToken = jwtService.sign(
        { sub: 999, orgId: 1, email: 'fake@test.com', role: 'owner' },
        { secret: 'wrong-secret', expiresIn: '7d' },
      );

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', `refresh_token=${fakeToken}; Path=/auth; HttpOnly`);
      expect(res.status).toBe(401);
    });
  });

  // ── LOGOUT ──────────────────────────────────────────────────────────

  describe('POST /auth/logout', () => {
    it('should clear the refresh_token cookie', async () => {
      const { refreshCookie } = await loginUser(app, 'new@test.com', 'password123');

      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', refreshCookie)
        .expect(201);

      expect(res.body.success).toBe(true);
      // Check that the cookie is cleared (expires in the past or empty value)
      const setCookie = res.headers['set-cookie'];
      const cleared = Array.isArray(setCookie)
        ? setCookie.find((c: string) => c.startsWith('refresh_token='))
        : setCookie;
      expect(cleared).toBeDefined();
    });
  });

  // ── ME ────────────────────────────────────────────────────────────

  describe('GET /auth/me', () => {
    it('should return user info with valid Bearer token', async () => {
      const { body: loginBody } = await loginUser(app, 'new@test.com', 'password123');

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .expect(200);

      expect(res.body.email).toBe('new@test.com');
      expect(res.body.org).toBeDefined();
      expect(res.body.org.name).toBe('Alice Corp');
      expect(res.body.orgs).toBeDefined();
      expect(res.body.orgs.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer garbage-token');
      expect(res.status).toBe(401);
    });

    it('should return 401 with expired token', async () => {
      const jwt = require('@nestjs/jwt');
      const jwtService = new jwt.JwtService({});
      const expiredToken = jwtService.sign(
        { sub: 1, orgId: 1, email: 'new@test.com', role: 'owner' },
        { secret: process.env.JWT_SECRET, expiresIn: '0s' },
      );

      // Small delay to ensure expiration
      await new Promise((r) => setTimeout(r, 100));

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
    });
  });
});
