import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { resetDatabase, disconnectTestPrisma, testPrisma } from '../helpers/prisma-test.helper';
import { registerUser, loginUser, authGet, authPost } from '../helpers/auth.helper';
import {
  resetCounters, createCustomer, createPointsLog,
  createReferralTree, createSetting,
} from '../helpers/factories';

describe('Dashboard E2E', () => {
  let app: INestApplication;
  let token: string;
  let projectId: number;
  let customerA: any;
  let customerB: any;
  let customerC: any;

  // Second org for cross-org tests
  let otherToken: string;
  let otherProjectId: number;

  beforeAll(async () => {
    await resetDatabase();
    resetCounters();
    app = await createTestApp();

    // Register primary user
    const { body } = await registerUser(app, {
      email: 'dash@test.com',
      password: 'password123',
      name: 'Dashboard User',
      orgName: 'Dashboard Org',
    });
    token = body.accessToken;
    projectId = body.project.id;

    // Register second user for cross-org tests
    const { body: otherBody } = await registerUser(app, {
      email: 'other@test.com',
      password: 'password123',
      name: 'Other User',
      orgName: 'Other Org',
    });
    otherToken = otherBody.accessToken;
    otherProjectId = otherBody.project.id;

    // Seed test data: 3 customers
    customerA = await createCustomer(projectId, {
      email: 'alice@example.com',
      name: 'Alice Smith',
      pointsBalance: 100,
      pointsEarnedTotal: 150,
      orderCount: 3,
    });
    customerB = await createCustomer(projectId, {
      email: 'bob@example.com',
      name: 'Bob Jones',
      pointsBalance: 50,
      pointsEarnedTotal: 80,
      orderCount: 1,
      referredBy: customerA.referralCode,
    });
    customerC = await createCustomer(projectId, {
      email: 'charlie@example.com',
      name: 'Charlie Brown',
      pointsBalance: 200,
      pointsEarnedTotal: 200,
      orderCount: 5,
      referredBy: customerB.referralCode,
    });

    // Points logs
    await createPointsLog(projectId, customerA.id, { points: 100, type: 'purchase', description: 'Order #1' });
    await createPointsLog(projectId, customerA.id, { points: 50, type: 'signup', description: 'Welcome bonus' });
    await createPointsLog(projectId, customerB.id, { points: 50, type: 'purchase', description: 'Order #2' });

    // Referral tree: B referred by A, C referred by B
    await createReferralTree(projectId, customerB.id, customerA.id);
    await createReferralTree(projectId, customerC.id, customerB.id);

    // Settings (use keys that still exist in DEFAULTS)
    await createSetting(projectId, 'widget_primary_color', '#ff0000');
    await createSetting(projectId, 'min_order_referral', '15');
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestPrisma();
  });

  // ── STATS ─────────────────────────────────────────────────────────

  describe('GET /api/v1/projects/:id/stats', () => {
    it('should return stats, recentActivity, topReferrers', async () => {
      const res = await authGet(app, token, `/api/v1/projects/${projectId}/stats`).expect(200);

      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.totalCustomers).toBeGreaterThanOrEqual(3);
      expect(res.body.recentActivity).toBeDefined();
      expect(Array.isArray(res.body.recentActivity)).toBe(true);
      expect(res.body.topReferrers).toBeDefined();
      expect(Array.isArray(res.body.topReferrers)).toBe(true);
    });

    it('should return 403 for other org project', async () => {
      const res = await authGet(app, otherToken, `/api/v1/projects/${projectId}/stats`);
      expect(res.status).toBe(403);
    });

    it('should return 401 without token', async () => {
      const res = await request(app.getHttpServer()).get(`/api/v1/projects/${projectId}/stats`);
      expect(res.status).toBe(401);
    });
  });

  // ── CUSTOMERS LIST ────────────────────────────────────────────────

  describe('GET /api/v1/projects/:id/customers', () => {
    it('should return customer list with snake_case fields and total', async () => {
      const res = await authGet(app, token, `/api/v1/projects/${projectId}/customers`).expect(200);

      expect(res.body.customers).toBeDefined();
      expect(Array.isArray(res.body.customers)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(3);

      // Verify snake_case
      const c = res.body.customers[0];
      expect(c).toHaveProperty('points_balance');
      expect(c).toHaveProperty('referral_code');
    });

    it('should search by email (case-insensitive)', async () => {
      const res = await authGet(app, token, `/api/v1/projects/${projectId}/customers?q=alice`).expect(200);

      expect(res.body.customers.length).toBeGreaterThanOrEqual(1);
      expect(res.body.customers[0].email).toContain('alice');
    });

    it('should search by name', async () => {
      const res = await authGet(app, token, `/api/v1/projects/${projectId}/customers?q=Smith`).expect(200);

      expect(res.body.customers.length).toBeGreaterThanOrEqual(1);
    });

    it('should support sorting', async () => {
      const res = await authGet(app, token, `/api/v1/projects/${projectId}/customers?sort=points_balance&dir=desc`)
        .expect(200);

      if (res.body.customers.length >= 2) {
        expect(res.body.customers[0].points_balance).toBeGreaterThanOrEqual(res.body.customers[1].points_balance);
      }
    });

    it('should support pagination', async () => {
      const res = await authGet(app, token, `/api/v1/projects/${projectId}/customers?limit=1&offset=0`)
        .expect(200);

      expect(res.body.customers.length).toBe(1);
      expect(res.body.total).toBeGreaterThanOrEqual(3);
    });
  });

  // ── CUSTOMER DETAIL ───────────────────────────────────────────────

  describe('GET /api/v1/projects/:id/customers/:custId', () => {
    it('should return customer detail with history and referralStats', async () => {
      const res = await authGet(app, token, `/api/v1/projects/${projectId}/customers/${customerA.id}`)
        .expect(200);

      expect(res.body.customer).toBeDefined();
      expect(res.body.customer.email).toBe('alice@example.com');
      expect(res.body.history).toBeDefined();
      expect(Array.isArray(res.body.history)).toBe(true);
      expect(res.body.referralStats).toBeDefined();
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await authGet(app, token, `/api/v1/projects/${projectId}/customers/99999`);
      expect(res.status).toBe(404);
    });
  });

  // ── AWARD / DEDUCT ────────────────────────────────────────────────

  describe('POST /api/v1/projects/:id/customers/:custId/award', () => {
    it('should award points and return new balance', async () => {
      const res = await authPost(app, token, `/api/v1/projects/${projectId}/customers/${customerA.id}/award`, {
        points: 25,
        reason: 'Test award',
      }).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.new_balance).toBeDefined();
      expect(res.body.new_balance).toBe(125); // was 100 + 25
    });

    it('should return 400 for invalid points (0)', async () => {
      const res = await authPost(app, token, `/api/v1/projects/${projectId}/customers/${customerA.id}/award`, {
        points: 0,
      });
      expect(res.status).toBe(400);
    });

    it('should return 400 for negative points', async () => {
      const res = await authPost(app, token, `/api/v1/projects/${projectId}/customers/${customerA.id}/award`, {
        points: -5,
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/projects/:id/customers/:custId/deduct', () => {
    it('should deduct points and return new balance', async () => {
      const res = await authPost(app, token, `/api/v1/projects/${projectId}/customers/${customerA.id}/deduct`, {
        points: 10,
        reason: 'Test deduction',
      }).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.new_balance).toBeDefined();
      expect(res.body.new_balance).toBe(115); // was 125 - 10
    });
  });

  // ── SETTINGS ──────────────────────────────────────────────────────

  describe('GET /api/v1/projects/:id/settings', () => {
    it('should return settings and defaults', async () => {
      const res = await authGet(app, token, `/api/v1/projects/${projectId}/settings`).expect(200);

      expect(res.body.settings).toBeDefined();
      expect(res.body.defaults).toBeDefined();
    });
  });

  describe('POST /api/v1/projects/:id/settings', () => {
    it('should save settings and persist', async () => {
      const res = await authPost(app, token, `/api/v1/projects/${projectId}/settings`, {
        widget_primary_color: '#00ff00',
        min_order_referral: '20',
      }).expect(201);

      expect(res.body.success).toBe(true);

      // Verify persisted
      const getRes = await authGet(app, token, `/api/v1/projects/${projectId}/settings`).expect(200);
      expect(getRes.body.settings.widget_primary_color).toBe('#00ff00');
      expect(getRes.body.settings.min_order_referral).toBe('20');
    });

    it('should ignore unknown keys', async () => {
      const res = await authPost(app, token, `/api/v1/projects/${projectId}/settings`, {
        unknown_key: 'value',
        widget_primary_color: '#0000ff',
      }).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.settings.unknown_key).toBeUndefined();
      expect(res.body.settings.widget_primary_color).toBe('#0000ff');
    });
  });

  // ── REFERRALS ─────────────────────────────────────────────────────

  describe('GET /api/v1/projects/:id/referrals', () => {
    it('should return referral tree data', async () => {
      const res = await authGet(app, token, `/api/v1/projects/${projectId}/referrals`).expect(200);

      expect(res.body.trees).toBeDefined();
      expect(Array.isArray(res.body.trees)).toBe(true);
      expect(res.body.totalChains).toBeGreaterThanOrEqual(1);
      expect(res.body.totalMembers).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 without token', async () => {
      const res = await request(app.getHttpServer()).get(`/api/v1/projects/${projectId}/referrals`);
      expect(res.status).toBe(401);
    });
  });

  // ── ROLE-GATED ACCESS ──────────────────────────────────────────────

  describe('Project role-gated access', () => {
    let viewerToken: string;
    let editorToken: string;

    beforeAll(async () => {
      // Create viewer member in same org
      await authPost(app, token, '/api/v1/orgs/me/members', {
        email: 'viewer-dash@test.com',
        password: 'password123',
        name: 'Viewer User',
        role: 'member',
      }).expect(201);

      const { body: viewerBody } = await loginUser(app, 'viewer-dash@test.com', 'password123');
      viewerToken = viewerBody.accessToken;

      const viewerMe = await authGet(app, viewerToken, '/auth/me').expect(200);
      const viewerUserId = viewerMe.body.id;

      // Add viewer to project
      await authPost(app, token, `/api/v1/projects/${projectId}/members`, {
        userId: viewerUserId,
        role: 'viewer',
      }).expect(201);

      // Create editor member in same org
      await authPost(app, token, '/api/v1/orgs/me/members', {
        email: 'editor-dash@test.com',
        password: 'password123',
        name: 'Editor User',
        role: 'member',
      }).expect(201);

      const { body: editorBody } = await loginUser(app, 'editor-dash@test.com', 'password123');
      editorToken = editorBody.accessToken;

      const editorMe = await authGet(app, editorToken, '/auth/me').expect(200);
      const editorUserId = editorMe.body.id;

      // Add editor to project
      await authPost(app, token, `/api/v1/projects/${projectId}/members`, {
        userId: editorUserId,
        role: 'editor',
      }).expect(201);
    });

    it('viewer can read stats', async () => {
      const res = await authGet(app, viewerToken, `/api/v1/projects/${projectId}/stats`);
      expect(res.status).toBe(200);
    });

    it('viewer can read customers', async () => {
      const res = await authGet(app, viewerToken, `/api/v1/projects/${projectId}/customers`);
      expect(res.status).toBe(200);
    });

    it('viewer cannot award points', async () => {
      const res = await authPost(app, viewerToken, `/api/v1/projects/${projectId}/customers/${customerA.id}/award`, {
        points: 5,
        reason: 'test',
      });
      expect(res.status).toBe(403);
    });

    it('viewer cannot update settings', async () => {
      const res = await authPost(app, viewerToken, `/api/v1/projects/${projectId}/settings`, {
        widget_primary_color: '#999999',
      });
      expect(res.status).toBe(403);
    });

    it('editor can award points', async () => {
      const res = await authPost(app, editorToken, `/api/v1/projects/${projectId}/customers/${customerA.id}/award`, {
        points: 5,
        reason: 'editor test',
      });
      expect(res.status).toBe(201);
    });

    it('editor can update settings', async () => {
      const res = await authPost(app, editorToken, `/api/v1/projects/${projectId}/settings`, {
        widget_primary_color: '#123456',
      });
      expect(res.status).toBe(201);
    });
  });
});
