import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { resetDatabase, disconnectTestPrisma, testPrisma } from '../helpers/prisma-test.helper';
import {
  createOrg, createProject, createCustomer, createSetting,
  createReferralTree, createApiKeyPair, resetCounters,
  createReferralLevel, seedDefaultEarnActions,
} from '../helpers/factories';

describe('Webhook E2E', () => {
  let app: INestApplication;
  let projectId: number;
  let secretKey: string;
  let publicKey: string;
  let grandparent: any;
  let parent: any;
  let buyer: any;

  beforeAll(async () => {
    await resetDatabase();
    resetCounters();
    app = await createTestApp();

    const org = await createOrg();
    const project = await createProject(org.id);
    projectId = project.id;

    const keys = await createApiKeyPair(projectId);
    secretKey = keys.secretKey;
    publicKey = keys.publicKey;

    const { DEFAULTS } = require('../../src/config/config.constants');
    for (const [key, val] of Object.entries(DEFAULTS)) {
      await createSetting(projectId, key, val as string);
    }

    // Seed earn actions (webhook service uses earnActionsService.getAction)
    await seedDefaultEarnActions(projectId);

    // Seed referral levels (replaces old referral_l2_points / referral_l3_points settings)
    await createReferralLevel(projectId, 2, 5);   // L2 parent gets 5 pts
    await createReferralLevel(projectId, 3, 2);   // L3 grandparent gets 2 pts

    // Build a 3-level referral chain: grandparent -> parent -> buyer
    grandparent = await createCustomer(projectId, {
      email: 'gp@test.com',
      name: 'Grandparent',
      signupRewarded: true,
      pointsBalance: 0,
      pointsEarnedTotal: 0,
    });

    parent = await createCustomer(projectId, {
      email: 'parent@test.com',
      name: 'Parent',
      referredBy: grandparent.referralCode,
      signupRewarded: true,
      pointsBalance: 0,
      pointsEarnedTotal: 0,
    });
    await createReferralTree(projectId, parent.id, grandparent.id);

    buyer = await createCustomer(projectId, {
      email: 'buyer@test.com',
      name: 'Buyer',
      referredBy: parent.referralCode,
      signupRewarded: true,
      pointsBalance: 0,
      pointsEarnedTotal: 0,
    });
    await createReferralTree(projectId, buyer.id, parent.id);
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestPrisma();
  });

  // ── AUTH TESTS ──────────────────────────────────────────────────────

  describe('Authentication', () => {
    it('should reject request without secret key', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/webhooks/order')
        .send({ customer_email: 'test@test.com', order_id: 'ORD-AUTH', order_total: 50 })
        .expect(401);
    });

    it('should reject request with public key', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/webhooks/order')
        .set('X-Secret-Key', publicKey)
        .send({ customer_email: 'test@test.com', order_id: 'ORD-AUTH2', order_total: 50 })
        .expect(401);
    });

    it('should reject request with invalid secret key', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/webhooks/order')
        .set('X-Secret-Key', 'sk_live_invalid000000000000000000000000000000000000000000000')
        .send({ customer_email: 'test@test.com', order_id: 'ORD-AUTH3', order_total: 50 })
        .expect(401);
    });
  });

  // ── ORDER WEBHOOK ─────────────────────────────────────────────────

  describe('POST /api/v1/webhooks/order', () => {
    it('should award purchase points (generic format)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/webhooks/order')
        .set('X-Secret-Key', secretKey)
        .send({
          customer_email: 'buyer@test.com',
          customer_name: 'Buyer',
          order_id: 'ORD-001',
          order_total: 50.00,
        })
        .expect(201);

      expect(res.body.status).toBe('processed');

      const updated = await testPrisma.customer.findUnique({
        where: { id: buyer.id },
      });
      expect(updated!.pointsBalance).toBeGreaterThanOrEqual(10);
      expect(updated!.orderCount).toBe(1);
    });

    it('should award first order bonus', async () => {
      // Webhook service uses CustomerActionLog (not legacy firstOrderRewarded flag)
      const actionLog = await testPrisma.customerActionLog.findFirst({
        where: { projectId, customerId: buyer.id, actionSlug: 'first_order' },
      });
      expect(actionLog).not.toBeNull();

      const firstOrderLog = await testPrisma.pointsLog.findFirst({
        where: { customerId: buyer.id, type: 'first_order' },
      });
      expect(firstOrderLog).not.toBeNull();
      expect(firstOrderLog!.points).toBe(50);
    });

    it('should award L2 referral points to parent', async () => {
      const updatedParent = await testPrisma.customer.findUnique({
        where: { id: parent.id },
      });
      expect(updatedParent!.pointsBalance).toBe(5);
    });

    it('should award L3 referral points to grandparent', async () => {
      const updatedGP = await testPrisma.customer.findUnique({
        where: { id: grandparent.id },
      });
      expect(updatedGP!.pointsBalance).toBe(2);
    });

    it('should prevent duplicate order processing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/webhooks/order')
        .set('X-Secret-Key', secretKey)
        .send({
          customer_email: 'buyer@test.com',
          order_id: 'ORD-001',
          order_total: 50.00,
        })
        .expect(201);

      expect(res.body.status).toBe('already_processed');
    });

    it('should process a second order without first_order bonus', async () => {
      const balanceBefore = (await testPrisma.customer.findUnique({ where: { id: buyer.id } }))!.pointsBalance;

      await request(app.getHttpServer())
        .post('/api/v1/webhooks/order')
        .set('X-Secret-Key', secretKey)
        .send({
          customer_email: 'buyer@test.com',
          order_id: 'ORD-002',
          order_total: 50.00,
        })
        .expect(201);

      const balanceAfter = (await testPrisma.customer.findUnique({ where: { id: buyer.id } }))!.pointsBalance;
      const pointsGained = balanceAfter - balanceBefore;
      expect(pointsGained).toBe(10);
    });

    it('should skip referral points when order below min_order_referral', async () => {
      const lowBuyer = await createCustomer(projectId, {
        email: 'lowbuyer@test.com',
        name: 'Low Buyer',
        signupRewarded: true,
      });
      await createReferralTree(projectId, lowBuyer.id, parent.id);

      const parentBefore = (await testPrisma.customer.findUnique({ where: { id: parent.id } }))!.pointsBalance;

      await request(app.getHttpServer())
        .post('/api/v1/webhooks/order')
        .set('X-Secret-Key', secretKey)
        .send({
          customer_email: 'lowbuyer@test.com',
          order_id: 'ORD-LOW',
          order_total: 5.00,
        })
        .expect(201);

      const parentAfter = (await testPrisma.customer.findUnique({ where: { id: parent.id } }))!.pointsBalance;
      expect(parentAfter).toBe(parentBefore);
    });

    it('should accept Shopify format payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/webhooks/order')
        .set('X-Secret-Key', secretKey)
        .send({
          id: 'SHOP-001',
          customer: { email: 'shopify@test.com', first_name: 'Shop', last_name: 'User' },
          total_price: '30.00',
        })
        .expect(201);

      expect(res.body.status).toBe('processed');

      const customer = await testPrisma.customer.findUnique({
        where: { projectId_email: { projectId, email: 'shopify@test.com' } },
      });
      expect(customer).not.toBeNull();
    });

    it('should link referral when referral_code is provided for new customer', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/webhooks/order')
        .set('X-Secret-Key', secretKey)
        .send({
          customer_email: 'newref@test.com',
          customer_name: 'New Ref',
          order_id: 'ORD-REF',
          order_total: 50.00,
          referral_code: parent.referralCode,
        })
        .expect(201);

      expect(res.body.status).toBe('processed');

      const newCust = await testPrisma.customer.findUnique({
        where: { projectId_email: { projectId, email: 'newref@test.com' } },
      });
      expect(newCust!.referredBy).toBe(parent.referralCode);

      const tree = await testPrisma.referralTree.findUnique({
        where: { projectId_customerId: { projectId, customerId: newCust!.id } },
      });
      expect(tree).not.toBeNull();
      expect(tree!.parentId).toBe(parent.id);
    });
  });

  // ── CUSTOMER CREATED WEBHOOK ──────────────────────────────────────

  describe('POST /api/v1/webhooks/customer', () => {
    it('should create customer and award signup points (generic format)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/webhooks/customer')
        .set('X-Secret-Key', secretKey)
        .send({ customer_email: 'webhookcust@test.com', customer_name: 'Webhook Cust' })
        .expect(201);

      expect(res.body.status).toBe('processed');

      const customer = await testPrisma.customer.findUnique({
        where: { projectId_email: { projectId, email: 'webhookcust@test.com' } },
      });
      expect(customer).not.toBeNull();

      // Webhook service uses CustomerActionLog (not legacy signupRewarded flag)
      const actionLog = await testPrisma.customerActionLog.findFirst({
        where: { projectId, customerId: customer!.id, actionSlug: 'signup' },
      });
      expect(actionLog).not.toBeNull();
    });

    it('should accept Shopify format payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/webhooks/customer')
        .set('X-Secret-Key', secretKey)
        .send({ email: 'shopifycust@test.com', first_name: 'Shopify', last_name: 'Customer' })
        .expect(201);

      expect(res.body.status).toBe('processed');
    });

    it('should not double-reward signup on repeat', async () => {
      const before = await testPrisma.customer.findUnique({
        where: { projectId_email: { projectId, email: 'webhookcust@test.com' } },
      });

      await request(app.getHttpServer())
        .post('/api/v1/webhooks/customer')
        .set('X-Secret-Key', secretKey)
        .send({ customer_email: 'webhookcust@test.com' })
        .expect(201);

      const after = await testPrisma.customer.findUnique({
        where: { projectId_email: { projectId, email: 'webhookcust@test.com' } },
      });

      expect(after!.pointsBalance).toBe(before!.pointsBalance);
    });

    it('should return 400 for missing email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/webhooks/customer')
        .set('X-Secret-Key', secretKey)
        .send({ customer_name: 'No Email' });
      expect(res.status).toBe(400);
    });
  });

  // ── REFUND WEBHOOK ────────────────────────────────────────────────

  describe('POST /api/v1/webhooks/refund', () => {
    it('should clawback all order points', async () => {
      const balanceBefore = (await testPrisma.customer.findUnique({ where: { id: buyer.id } }))!.pointsBalance;

      const res = await request(app.getHttpServer())
        .post('/api/v1/webhooks/refund')
        .set('X-Secret-Key', secretKey)
        .send({ order_id: 'ORD-001' })
        .expect(201);

      expect(res.body.status).toBe('processed');
      expect(res.body.clawbacks).toBeGreaterThan(0);

      const balanceAfter = (await testPrisma.customer.findUnique({ where: { id: buyer.id } }))!.pointsBalance;
      expect(balanceAfter).toBeLessThan(balanceBefore);
    });

    it('should handle refund for non-existent order gracefully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/webhooks/refund')
        .set('X-Secret-Key', secretKey)
        .send({ order_id: 'NON-EXISTENT' })
        .expect(201);

      expect(res.body.status).toBe('processed');
      expect(res.body.clawbacks).toBe(0);
    });
  });
});
