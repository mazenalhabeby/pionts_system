import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { resetDatabase, disconnectTestPrisma, testPrisma } from '../helpers/prisma-test.helper';
import { loginCustomer } from '../helpers/auth.helper';
import {
  createOrg, createProject, createCustomer, createSetting,
  createReferralTree, resetCounters, seedDefaultRedemptionTiers,
} from '../helpers/factories';

describe('Customer API E2E', () => {
  let app: INestApplication;
  let projectId: number;
  let referrerCode: string;
  let customerCookie: string;

  beforeAll(async () => {
    await resetDatabase();
    resetCounters();
    app = await createTestApp();

    // Seed project with settings
    const org = await createOrg();
    const project = await createProject(org.id);
    projectId = project.id;

    const { DEFAULTS } = require('../../src/config/config.constants');
    for (const [key, val] of Object.entries(DEFAULTS)) {
      await createSetting(projectId, key, val as string);
    }

    // Seed legacy point settings (legacy controller reads these via configService.getInt)
    await createSetting(projectId, 'signup_points', '20');
    await createSetting(projectId, 'follow_tiktok_points', '10');
    await createSetting(projectId, 'follow_instagram_points', '10');
    await createSetting(projectId, 'review_photo_points', '12');
    await createSetting(projectId, 'review_text_points', '5');
    await createSetting(projectId, 'share_product_points', '5');
    await createSetting(projectId, 'birthday_points', '25');

    // Seed redemption tiers (redeem endpoint reads from RedemptionTier table)
    await seedDefaultRedemptionTiers(projectId);

    // Load settings into AppConfigService cache (legacy controller reads from cache, not DB)
    const { AppConfigService } = require('../../src/config/app-config.service');
    const configService = app.get(AppConfigService);
    await configService.loadSettingsForProject(projectId);

    // Create a referrer customer
    const referrer = await createCustomer(projectId, {
      email: 'referrer@test.com',
      name: 'Referrer',
      pointsBalance: 200,
      pointsEarnedTotal: 200,
      signupRewarded: true,
    });
    referrerCode = referrer.referralCode;
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestPrisma();
  });

  // ── SIGNUP ────────────────────────────────────────────────────────

  describe('POST /api/signup', () => {
    it('should create customer and award signup points', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/signup')
        .send({ email: 'newcust@test.com', name: 'New Cust' })
        .expect(201);

      expect(res.body.referral_code).toBeDefined();
      expect(res.body.referral_code.length).toBe(6);
      expect(res.body.points_balance).toBe(20); // default signup_points
    });

    it('should link referral when referred_by is provided', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/signup')
        .send({ email: 'referred@test.com', name: 'Referred', referred_by: referrerCode })
        .expect(201);

      expect(res.body.referral_code).toBeDefined();

      // Check referral tree was created
      const customer = await testPrisma.customer.findUnique({
        where: { projectId_email: { projectId, email: 'referred@test.com' } },
      });
      const tree = await testPrisma.referralTree.findUnique({
        where: { projectId_customerId: { projectId, customerId: customer!.id } },
      });
      expect(tree).not.toBeNull();
      expect(tree!.parentId).toBeDefined();
    });

    it('should not double-award signup points on re-signup', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/signup')
        .send({ email: 'newcust@test.com', name: 'New Cust' })
        .expect(201);

      // Balance should still be 20, not 40
      expect(res.body.points_balance).toBe(20);
    });

    it('should return 400 for missing email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/signup')
        .send({ name: 'No Email' });
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/signup')
        .send({ email: 'not-valid' });
      expect(res.status).toBe(400);
    });

    it('should ignore invalid referral codes gracefully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/signup')
        .send({ email: 'grace@test.com', referred_by: 'XXXXXX' })
        .expect(201);

      expect(res.body.referral_code).toBeDefined();
    });
  });

  // ── CHECK REFERRAL ────────────────────────────────────────────────

  describe('GET /api/check-ref/:code', () => {
    it('should return valid for existing referral code', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/check-ref/${referrerCode}`)
        .expect(200);

      expect(res.body.valid).toBe(true);
      expect(res.body.referrer_name).toBe('Referrer');
      expect(res.body.discount_percent).toBeDefined();
    });

    it('should return invalid for non-existent code', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/check-ref/ZZZZZZ')
        .expect(200);

      expect(res.body.valid).toBe(false);
    });
  });

  // ── CUSTOMER AUTH ─────────────────────────────────────────────────

  describe('Customer Auth Flow', () => {
    it('POST /api/auth/send-code should send verification code', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/send-code')
        .send({ email: 'newcust@test.com' })
        .expect(201);

      expect(res.body.success).toBe(true);

      // Verify code was saved to DB
      const customer = await testPrisma.customer.findUnique({
        where: { projectId_email: { projectId, email: 'newcust@test.com' } },
      });
      expect(customer!.verificationCode).toBeDefined();
      expect(customer!.verificationCode!.length).toBe(6);
    });

    it('POST /api/auth/send-code should return 404 for unknown email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/send-code')
        .send({ email: 'nobody@test.com' });
      expect(res.status).toBe(404);
    });

    it('POST /api/auth/verify-code should set session and verify email', async () => {
      // First send a code
      await request(app.getHttpServer())
        .post('/api/auth/send-code')
        .send({ email: 'newcust@test.com' })
        .expect(201);

      // Read code from DB
      const customer = await testPrisma.customer.findUnique({
        where: { projectId_email: { projectId, email: 'newcust@test.com' } },
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-code')
        .send({ email: 'newcust@test.com', code: customer!.verificationCode })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('POST /api/auth/verify-code should reject wrong code', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/send-code')
        .send({ email: 'newcust@test.com' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-code')
        .send({ email: 'newcust@test.com', code: '000000' });
      expect(res.status).toBe(400);
    });

    it('POST /api/auth/verify-code should reject expired code', async () => {
      // Manually set an expired code
      const customer = await testPrisma.customer.findUnique({
        where: { projectId_email: { projectId, email: 'newcust@test.com' } },
      });
      await testPrisma.customer.update({
        where: { id: customer!.id },
        data: {
          verificationCode: '123456',
          verificationExpiry: new Date(Date.now() - 60000).toISOString(),
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-code')
        .send({ email: 'newcust@test.com', code: '123456' });
      expect(res.status).toBe(400);
    });
  });

  // ── CUSTOMER ME ───────────────────────────────────────────────────

  describe('GET /api/customer/me', () => {
    beforeAll(async () => {
      customerCookie = await loginCustomer(app, testPrisma, 'newcust@test.com', projectId);
    });

    it('should return full customer profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/customer/me')
        .set('Cookie', customerCookie)
        .expect(200);

      expect(res.body.email).toBe('newcust@test.com');
      expect(res.body.points_balance).toBeDefined();
      expect(res.body.referral_code).toBeDefined();
      expect(res.body.history).toBeInstanceOf(Array);
      expect(res.body.referral_stats).toBeDefined();
      expect(res.body.redemption_tiers).toBeInstanceOf(Array);
    });

    it('should return 401 without session', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/customer/me');
      expect(res.status).toBe(401);
    });
  });

  // ── AWARD ─────────────────────────────────────────────────────────

  describe('POST /api/award', () => {
    it('should award follow_tiktok points', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/award')
        .set('Cookie', customerCookie)
        .send({ type: 'follow_tiktok' })
        .expect(201);

      expect(res.body.points_awarded).toBe(10);
      expect(res.body.new_balance).toBeGreaterThan(0);
    });

    it('should enforce one-time flag for follow_tiktok', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/award')
        .set('Cookie', customerCookie)
        .send({ type: 'follow_tiktok' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Already claimed');
    });

    it('should award review_photo points', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/award')
        .set('Cookie', customerCookie)
        .send({ type: 'review_photo' })
        .expect(201);

      expect(res.body.points_awarded).toBe(12);
    });

    it('should award share_product points (repeatable)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/award')
        .set('Cookie', customerCookie)
        .send({ type: 'share_product' })
        .expect(201);

      expect(res.body.points_awarded).toBe(5);
    });

    it('should return 400 for invalid award type', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/award')
        .set('Cookie', customerCookie)
        .send({ type: 'invalid_type' });
      expect(res.status).toBe(400);
    });

    it('should require customer auth', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/award')
        .send({ type: 'follow_tiktok' });
      expect(res.status).toBe(401);
    });
  });

  // ── REDEEM ────────────────────────────────────────────────────────

  describe('POST /api/redeem', () => {
    it('should redeem points for a discount code', async () => {
      // Ensure customer has enough points
      const customer = await testPrisma.customer.findUnique({
        where: { projectId_email: { projectId, email: 'newcust@test.com' } },
      });
      if (customer!.pointsBalance < 50) {
        await testPrisma.customer.update({
          where: { id: customer!.id },
          data: { pointsBalance: 100, pointsEarnedTotal: 100 },
        });
      }

      const res = await request(app.getHttpServer())
        .post('/api/redeem')
        .set('Cookie', customerCookie)
        .send({ tier_points: 50 })
        .expect(201);

      expect(res.body.discount_code).toBeDefined();
      expect(res.body.discount_code).toContain('8BC-');
      expect(res.body.discount_amount).toBe(2);
      expect(res.body.new_balance).toBeDefined();
    });

    it('should reject when insufficient points', async () => {
      // Set balance to 0
      const customer = await testPrisma.customer.findUnique({
        where: { projectId_email: { projectId, email: 'newcust@test.com' } },
      });
      await testPrisma.customer.update({
        where: { id: customer!.id },
        data: { pointsBalance: 0 },
      });

      const res = await request(app.getHttpServer())
        .post('/api/redeem')
        .set('Cookie', customerCookie)
        .send({ tier_points: 50 });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Not enough points');
    });

    it('should reject invalid tier', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/redeem')
        .set('Cookie', customerCookie)
        .send({ tier_points: 999 });
      expect(res.status).toBe(400);
    });

    it('should require customer auth', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/redeem')
        .send({ tier_points: 50 });
      expect(res.status).toBe(401);
    });
  });

  // ── CUSTOMER AUTH ME / LOGOUT ─────────────────────────────────────

  describe('GET /api/auth/me', () => {
    it('should return authenticated customer info', async () => {
      const freshCookie = await loginCustomer(app, testPrisma, 'referrer@test.com', projectId);
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', freshCookie)
        .expect(200);

      expect(res.body.authenticated).toBe(true);
      expect(res.body.email).toBe('referrer@test.com');
    });

    it('should return 401 without session', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should destroy session', async () => {
      const freshCookie = await loginCustomer(app, testPrisma, 'referrer@test.com', projectId);
      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', freshCookie)
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });
});
