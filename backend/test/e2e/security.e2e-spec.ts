import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestAppWithThrottling } from '../helpers/test-app.helper';
import { createOrg, createProject, createCustomer, seedProjectDefaults } from '../helpers/factories';
import { setupE2E } from '../helpers/e2e-setup';

describe('Security E2E', () => {
  const { getApp } = setupE2E();
  let app: INestApplication;

  beforeAll(async () => {
    app = getApp();

    const org = await createOrg();
    const project = await createProject(org.id);

    await seedProjectDefaults(project.id);

    await createCustomer(project.id, {
      email: 'sectest@test.com',
      name: 'SecTest',
    });
  });

  // ── SQL INJECTION ─────────────────────────────────────────────────

  describe('SQL Injection', () => {
    it('should handle SQL injection in auth credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: "admin'--", password: 'anything' });
      expect([400, 401]).toContain(res.status);
    });
  });

  // ── AUTH BYPASS ───────────────────────────────────────────────────

  describe('Auth Bypass', () => {
    it('should reject requests with no token to JWT-protected routes', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject requests with garbage token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer not.a.jwt.token');
      expect(res.status).toBe(401);
    });

    it('should reject requests with forged JWT (wrong secret)', async () => {
      const jwt = require('jsonwebtoken');
      const forgedToken = jwt.sign(
        { sub: 1, orgId: 1, email: 'admin@test.com', role: 'owner' },
        'wrong-secret-key',
        { expiresIn: '1h' },
      );

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`);
      expect(res.status).toBe(401);
    });

    it('should reject requests with "none" algorithm JWT', async () => {
      // Craft a JWT with "none" algorithm
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({ sub: 1, orgId: 1, email: 'admin@test.com', role: 'owner', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 }),
      ).toString('base64url');
      const noneToken = `${header}.${payload}.`;

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${noneToken}`);
      expect(res.status).toBe(401);
    });
  });

  // ── JWT MANIPULATION ──────────────────────────────────────────────

  describe('JWT Manipulation', () => {
    it('should reject JWT with tampered payload', async () => {
      // Register a real user to get a valid token structure
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'tamper@test.com', password: 'password123', orgName: 'Tamper Corp' })
        .expect(201);

      const parts = registerRes.body.accessToken.split('.');
      // Tamper with the payload to change role to admin
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      payload.role = 'admin';
      payload.sub = 9999;
      parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const tamperedToken = parts.join('.');

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`);
      expect(res.status).toBe(401);
    });

    it('should reject expired JWT token', async () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { sub: 1, orgId: 1, email: 'test@test.com', role: 'owner' },
        process.env.JWT_SECRET || 'test-jwt-secret',
        { expiresIn: '0s' },
      );

      await new Promise((r) => setTimeout(r, 100));

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
    });
  });

  // ── RATE LIMITING ─────────────────────────────────────────────────

  describe('Rate Limiting', () => {
    it('should return 429 after too many requests', async () => {
      let throttledApp: INestApplication | undefined;
      try {
        throttledApp = await createTestAppWithThrottling();
        let got429 = false;

        for (let i = 0; i < 65; i++) {
          const res = await request(throttledApp.getHttpServer())
            .get('/auth/me');
          if (res.status === 429) {
            got429 = true;
            break;
          }
        }

        expect(got429).toBe(true);
      } finally {
        if (throttledApp) await throttledApp.close();
      }
    });
  });
});
