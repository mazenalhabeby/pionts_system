import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { resetDatabase, disconnectTestPrisma, testPrisma } from '../helpers/prisma-test.helper';
import { loginAdmin, adminGet, adminPost } from '../helpers/auth.helper';
import {
  createOrg, createProject, createCustomer, createPointsLog,
  createReferralTree, createSetting, resetCounters,
} from '../helpers/factories';

describe('Admin E2E', () => {
  let app: INestApplication;
  let cookie: string;
  let projectId: number;
  let customerId: number;

  beforeAll(async () => {
    await resetDatabase();
    resetCounters();
    app = await createTestApp();

    // Seed a project with customers
    const org = await createOrg();
    const project = await createProject(org.id);
    projectId = project.id;

    // Create settings for the project
    const { DEFAULTS } = require('../../src/config/config.constants');
    for (const [key, val] of Object.entries(DEFAULTS)) {
      await createSetting(projectId, key, val as string);
    }

    const customer1 = await createCustomer(projectId, {
      email: 'alice@test.com',
      name: 'Alice',
      pointsBalance: 100,
      pointsEarnedTotal: 150,
      orderCount: 3,
      signupRewarded: true,
    });
    customerId = customer1.id;

    const customer2 = await createCustomer(projectId, {
      email: 'bob@test.com',
      name: 'Bob',
      pointsBalance: 50,
      pointsEarnedTotal: 75,
      orderCount: 1,
    });

    const customer3 = await createCustomer(projectId, {
      email: 'charlie@test.com',
      name: 'Charlie',
      referredBy: customer1.referralCode,
    });

    await createReferralTree(projectId, customer3.id, customer1.id);

    await createPointsLog(projectId, customer1.id, { points: 100, type: 'purchase', description: 'Purchase Order #1', orderId: '1001' });
    await createPointsLog(projectId, customer1.id, { points: 50, type: 'first_order', description: 'First order bonus' });
    await createPointsLog(projectId, customer2.id, { points: 50, type: 'purchase', description: 'Purchase Order #2', orderId: '1002' });

    cookie = await loginAdmin(app);
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestPrisma();
  });

  // ── SESSION AUTH ──────────────────────────────────────────────────

  describe('Session Auth', () => {
    it('POST /admin/login should set session', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/login')
        .send({ password: 'test-admin-pass' })
        .expect(201);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('POST /admin/login should reject wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/login')
        .send({ password: 'wrong' });
      expect(res.status).toBe(401);
    });

    it('GET /admin/api/session should return authenticated state', async () => {
      const res = await adminGet(app, cookie, '/admin/api/session').expect(200);
      expect(res.body.authenticated).toBe(true);
    });

    it('GET /admin/api/session without cookie should return false', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/api/session')
        .expect(200);
      expect(res.body.authenticated).toBe(false);
    });

    it('POST /admin/logout should destroy session', async () => {
      // Create a separate session to logout
      const loginRes = await request(app.getHttpServer())
        .post('/admin/login')
        .send({ password: 'test-admin-pass' })
        .expect(201);
      const logoutCookie = Array.isArray(loginRes.headers['set-cookie'])
        ? loginRes.headers['set-cookie'][0]
        : loginRes.headers['set-cookie'];

      await request(app.getHttpServer())
        .post('/admin/logout')
        .set('Cookie', logoutCookie)
        .expect(201);
    });
  });

  // ── STATS ─────────────────────────────────────────────────────────

  describe('GET /admin/api/stats', () => {
    it('should return stats, recentActivity, topReferrers', async () => {
      const res = await adminGet(app, cookie, '/admin/api/stats').expect(200);

      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.totalCustomers).toBeGreaterThanOrEqual(3);
      expect(res.body.stats.totalPoints).toBeGreaterThanOrEqual(0);
      expect(res.body.recentActivity).toBeInstanceOf(Array);
      expect(res.body.topReferrers).toBeInstanceOf(Array);
    });

    it('should require admin auth', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/api/stats');
      expect(res.status).toBe(401);
    });
  });

  // ── CUSTOMERS ─────────────────────────────────────────────────────

  describe('GET /admin/api/customers', () => {
    it('should return customer list', async () => {
      const res = await adminGet(app, cookie, '/admin/api/customers').expect(200);

      expect(res.body.customers).toBeInstanceOf(Array);
      expect(res.body.total).toBeGreaterThanOrEqual(3);
      // Responses should be snake_case
      const c = res.body.customers[0];
      expect(c).toHaveProperty('email');
      expect(c).toHaveProperty('points_balance');
    });

    it('should support search by email', async () => {
      const res = await adminGet(app, cookie, '/admin/api/customers?q=alice').expect(200);
      expect(res.body.customers.length).toBeGreaterThanOrEqual(1);
      expect(res.body.customers[0].email).toContain('alice');
    });

    it('should support search by name', async () => {
      const res = await adminGet(app, cookie, '/admin/api/customers?q=Bob').expect(200);
      expect(res.body.customers.length).toBeGreaterThanOrEqual(1);
    });

    it('should support sorting', async () => {
      const res = await adminGet(app, cookie, '/admin/api/customers?sort=points_balance&dir=desc').expect(200);
      const balances = res.body.customers.map((c: any) => c.points_balance);
      for (let i = 1; i < balances.length; i++) {
        expect(balances[i]).toBeLessThanOrEqual(balances[i - 1]);
      }
    });

    it('should support pagination', async () => {
      const res = await adminGet(app, cookie, '/admin/api/customers?limit=1&offset=0').expect(200);
      expect(res.body.customers.length).toBe(1);
      expect(res.body.total).toBeGreaterThanOrEqual(3);
    });

    it('should require admin auth', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/api/customers');
      expect(res.status).toBe(401);
    });
  });

  // ── CUSTOMER DETAIL ───────────────────────────────────────────────

  describe('GET /admin/api/customer/:id', () => {
    it('should return customer detail with history and referrals', async () => {
      const res = await adminGet(app, cookie, `/admin/api/customer/${customerId}`).expect(200);

      expect(res.body.customer).toBeDefined();
      expect(res.body.customer.email).toBe('alice@test.com');
      expect(res.body.history).toBeInstanceOf(Array);
      expect(res.body.referralStats).toBeDefined();
      expect(res.body.directReferrals).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await adminGet(app, cookie, '/admin/api/customer/99999');
      expect(res.status).toBe(404);
    });

    it('should require admin auth', async () => {
      const res = await request(app.getHttpServer())
        .get(`/admin/api/customer/${customerId}`);
      expect(res.status).toBe(401);
    });
  });

  // ── AWARD / DEDUCT ────────────────────────────────────────────────

  describe('POST /admin/api/customer/:id/award', () => {
    it('should award points and return new balance', async () => {
      const res = await adminPost(app, cookie, `/admin/api/customer/${customerId}/award`, {
        points: 25,
        reason: 'Test award',
      }).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.new_balance).toBe(125); // was 100
    });

    it('should return 400 for invalid points', async () => {
      const res = await adminPost(app, cookie, `/admin/api/customer/${customerId}/award`, {
        points: 0,
      });
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await adminPost(app, cookie, '/admin/api/customer/99999/award', {
        points: 10,
      });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /admin/api/customer/:id/deduct', () => {
    it('should deduct points and return new balance', async () => {
      const res = await adminPost(app, cookie, `/admin/api/customer/${customerId}/deduct`, {
        points: 25,
        reason: 'Test deduction',
      }).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.new_balance).toBe(100); // back to 100
    });

    it('should return 400 for negative points', async () => {
      const res = await adminPost(app, cookie, `/admin/api/customer/${customerId}/deduct`, {
        points: -5,
      });
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await adminPost(app, cookie, '/admin/api/customer/99999/deduct', {
        points: 10,
      });
      expect(res.status).toBe(404);
    });
  });

  // ── SETTINGS ──────────────────────────────────────────────────────

  describe('Settings', () => {
    it('GET /admin/api/settings should return settings and defaults', async () => {
      const res = await adminGet(app, cookie, '/admin/api/settings').expect(200);
      expect(res.body.settings).toBeDefined();
      expect(res.body.defaults).toBeDefined();
      expect(res.body.defaults.min_order_referral).toBe('10');
    });

    it('POST /admin/api/settings should update settings', async () => {
      const res = await adminPost(app, cookie, '/admin/api/settings', {
        widget_primary_color: '#00ff00',
      }).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.settings.widget_primary_color).toBe('#00ff00');
    });

    it('should persist updated settings', async () => {
      const res = await adminGet(app, cookie, '/admin/api/settings').expect(200);
      expect(res.body.settings.widget_primary_color).toBe('#00ff00');
    });

    it('should ignore unknown setting keys', async () => {
      await adminPost(app, cookie, '/admin/api/settings', {
        unknown_key: '999',
      }).expect(201);

      const res = await adminGet(app, cookie, '/admin/api/settings').expect(200);
      expect(res.body.settings.unknown_key).toBeUndefined();
    });
  });

  // ── REFERRALS ─────────────────────────────────────────────────────

  describe('GET /admin/api/referrals', () => {
    it('should return referral tree data', async () => {
      const res = await adminGet(app, cookie, '/admin/api/referrals').expect(200);
      expect(res.body).toHaveProperty('trees');
      expect(res.body).toHaveProperty('totalChains');
      expect(res.body).toHaveProperty('deepest');
      expect(res.body).toHaveProperty('totalMembers');
    });

    it('should require admin auth', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/api/referrals');
      expect(res.status).toBe(401);
    });
  });
});
