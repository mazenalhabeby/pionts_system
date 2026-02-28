import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { resetDatabase, disconnectTestPrisma, testPrisma } from '../helpers/prisma-test.helper';
import {
  createOrg, createProject, createCustomer, createApiKeyPair,
  createRedemption, resetCounters,
} from '../helpers/factories';

describe('Discount E2E', () => {
  let app: INestApplication;
  let projectId: number;
  let secretKey: string;
  let publicKey: string;
  let customer: any;
  let unusedRedemption: any;
  let usedRedemption: any;

  // Second project for cross-project isolation
  let otherProjectId: number;
  let otherSecretKey: string;
  let otherRedemption: any;

  beforeAll(async () => {
    await resetDatabase();
    resetCounters();
    app = await createTestApp();

    // Project 1
    const org = await createOrg();
    const project = await createProject(org.id);
    projectId = project.id;

    const keys = await createApiKeyPair(projectId);
    secretKey = keys.secretKey;
    publicKey = keys.publicKey;

    customer = await createCustomer(projectId, {
      email: 'disc@test.com',
      name: 'Disc Customer',
      pointsBalance: 500,
    });

    unusedRedemption = await createRedemption(projectId, customer.id, {
      pointsSpent: 100,
      discountAmount: 5,
      discountCode: 'PIONTS-UNUSED-001',
      used: false,
    });

    usedRedemption = await createRedemption(projectId, customer.id, {
      pointsSpent: 200,
      discountAmount: 10,
      discountCode: 'PIONTS-USED-001',
      used: true,
    });

    // Project 2
    const otherProject = await createProject(org.id, { name: 'Other Project' });
    otherProjectId = otherProject.id;

    const otherKeys = await createApiKeyPair(otherProjectId);
    otherSecretKey = otherKeys.secretKey;

    const otherCustomer = await createCustomer(otherProjectId, {
      email: 'other@test.com',
      name: 'Other Customer',
    });

    otherRedemption = await createRedemption(otherProjectId, otherCustomer.id, {
      discountCode: 'PIONTS-OTHER-001',
    });
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestPrisma();
  });

  // ── AUTH ──────────────────────────────────────────────────────────

  describe('Authentication', () => {
    it('should reject request without secret key', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/discount/validate')
        .send({ code: 'PIONTS-UNUSED-001' })
        .expect(401);
    });

    it('should reject request with public key', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/discount/validate')
        .set('X-Secret-Key', publicKey)
        .send({ code: 'PIONTS-UNUSED-001' })
        .expect(401);
    });
  });

  // ── VALIDATE ─────────────────────────────────────────────────────

  describe('POST /api/v1/discount/validate', () => {
    it('should validate existing unused code', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/discount/validate')
        .set('X-Secret-Key', secretKey)
        .send({ code: 'PIONTS-UNUSED-001' })
        .expect(201);

      expect(res.body).toEqual({
        valid: true,
        discount_amount: 5,
        already_used: false,
      });
    });

    it('should validate already-used code', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/discount/validate')
        .set('X-Secret-Key', secretKey)
        .send({ code: 'PIONTS-USED-001' })
        .expect(201);

      expect(res.body).toEqual({
        valid: true,
        discount_amount: 10,
        already_used: true,
      });
    });

    it('should return invalid for non-existent code', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/discount/validate')
        .set('X-Secret-Key', secretKey)
        .send({ code: 'NONEXISTENT-CODE' })
        .expect(201);

      expect(res.body).toEqual({ valid: false });
    });

    it('should return invalid for code from another project (isolation)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/discount/validate')
        .set('X-Secret-Key', secretKey)
        .send({ code: 'PIONTS-OTHER-001' })
        .expect(201);

      expect(res.body).toEqual({ valid: false });
    });

    it('should return 400 for missing code', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/discount/validate')
        .set('X-Secret-Key', secretKey)
        .send({})
        .expect(400);
    });
  });

  // ── MARK USED ────────────────────────────────────────────────────

  describe('POST /api/v1/discount/mark-used', () => {
    it('should mark unused code as used', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/discount/mark-used')
        .set('X-Secret-Key', secretKey)
        .send({ code: 'PIONTS-UNUSED-001' })
        .expect(201);

      expect(res.body).toEqual({ success: true });

      const updated = await testPrisma.redemption.findUnique({
        where: { id: unusedRedemption.id },
      });
      expect(updated!.used).toBe(true);
    });

    it('should be idempotent — marking already used code still succeeds', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/discount/mark-used')
        .set('X-Secret-Key', secretKey)
        .send({ code: 'PIONTS-UNUSED-001' })
        .expect(201);

      expect(res.body).toEqual({ success: true });
    });

    it('should return failure for non-existent code', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/discount/mark-used')
        .set('X-Secret-Key', secretKey)
        .send({ code: 'NONEXISTENT-CODE' })
        .expect(201);

      expect(res.body).toEqual({ success: false });
    });

    it('should return failure for code from another project (isolation)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/discount/mark-used')
        .set('X-Secret-Key', secretKey)
        .send({ code: 'PIONTS-OTHER-001' })
        .expect(201);

      expect(res.body).toEqual({ success: false });

      // Verify it wasn't actually marked used in the other project
      const unchanged = await testPrisma.redemption.findUnique({
        where: { id: otherRedemption.id },
      });
      expect(unchanged!.used).toBe(false);
    });
  });
});
