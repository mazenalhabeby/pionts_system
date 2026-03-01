import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { resetDatabase, disconnectTestPrisma } from '../helpers/prisma-test.helper';
import { registerUser, authGet, authPut, authPost, authDelete } from '../helpers/auth.helper';
import { resetCounters } from '../helpers/factories';

describe('Orgs E2E', () => {
  let app: INestApplication;
  let ownerToken: string;

  beforeAll(async () => {
    await resetDatabase();
    resetCounters();
    app = await createTestApp();

    const { body } = await registerUser(app, {
      email: 'owner@test.com',
      password: 'password123',
      name: 'Owner',
      orgName: 'Test Org',
    });
    ownerToken = body.accessToken;
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestPrisma();
  });

  // ── GET /api/v1/orgs/me ──────────────────────────────────────────

  describe('GET /api/v1/orgs/me', () => {
    it('should return org with memberCount and projectCount', async () => {
      const res = await authGet(app, ownerToken, '/api/v1/orgs/me').expect(200);

      expect(res.body.name).toBe('Test Org');
      expect(res.body.slug).toBeDefined();
      expect(res.body.memberCount).toBe(1);
      expect(res.body.projectCount).toBe(1);
    });

    it('should return 401 without token', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/orgs/me');
      expect(res.status).toBe(401);
    });
  });

  // ── PUT /api/v1/orgs/me ──────────────────────────────────────────

  describe('PUT /api/v1/orgs/me', () => {
    it('should update org name', async () => {
      const res = await authPut(app, ownerToken, '/api/v1/orgs/me', { name: 'Updated Org' })
        .expect(200);

      expect(res.body.name).toBe('Updated Org');

      // Verify persisted
      const getRes = await authGet(app, ownerToken, '/api/v1/orgs/me').expect(200);
      expect(getRes.body.name).toBe('Updated Org');

      // Reset name for other tests
      await authPut(app, ownerToken, '/api/v1/orgs/me', { name: 'Test Org' });
    });

    it('should return 400 for empty name', async () => {
      const res = await authPut(app, ownerToken, '/api/v1/orgs/me', { name: '' });
      expect(res.status).toBe(400);
    });
  });

  // ── GET /api/v1/orgs/me/members ──────────────────────────────────

  describe('GET /api/v1/orgs/me/members', () => {
    it('should return members list', async () => {
      const res = await authGet(app, ownerToken, '/api/v1/orgs/me/members').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toHaveProperty('email');
      expect(res.body[0]).toHaveProperty('role');
    });
  });

  // ── POST /api/v1/orgs/me/members ─────────────────────────────────

  describe('POST /api/v1/orgs/me/members', () => {
    it('should add an existing user to the org (owner can add)', async () => {
      // First, register another user in a different org
      await registerUser(app, {
        email: 'member@test.com',
        password: 'password123',
        name: 'New Member',
        orgName: 'Member Org',
      });

      const res = await authPost(app, ownerToken, '/api/v1/orgs/me/members', {
        email: 'member@test.com',
        role: 'member',
      }).expect(201);

      expect(res.body.email).toBe('member@test.com');
      expect(res.body.role).toBe('member');
    });

    it('should return 409 for duplicate membership', async () => {
      const res = await authPost(app, ownerToken, '/api/v1/orgs/me/members', {
        email: 'member@test.com',
        role: 'member',
      });
      expect(res.status).toBe(409);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await authPost(app, ownerToken, '/api/v1/orgs/me/members', {
        email: 'x@test.com',
      });
      expect(res.status).toBe(400);
    });

    it('should return 400 when user does not exist', async () => {
      const res = await authPost(app, ownerToken, '/api/v1/orgs/me/members', {
        email: 'nonexistent@test.com',
        role: 'member',
      });
      expect(res.status).toBe(400);
    });

    it('should return 403 when member role tries to add', async () => {
      // Login as the member we just added (they have membership in both orgs)
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'member@test.com', password: 'password123' })
        .expect(201);
      // Switch to Test Org if needed — the user's default org might be "Member Org"
      // They need to be in the context of "Test Org" for this test
      // Since the member was added to ownerToken's org, we need to switch
      let memberToken = loginRes.body.accessToken;
      const orgs = loginRes.body.orgs;
      const testOrg = orgs.find((o: any) => o.name === 'Test Org');
      if (testOrg && loginRes.body.org.name !== 'Test Org') {
        const switchRes = await request(app.getHttpServer())
          .post('/auth/switch-org')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({ orgId: testOrg.id })
          .expect(201);
        memberToken = switchRes.body.accessToken;
      }

      const res = await authPost(app, memberToken, '/api/v1/orgs/me/members', {
        email: 'another@test.com',
        role: 'member',
      });
      expect(res.status).toBe(403);
    });
  });

  // ── DELETE /api/v1/orgs/me/members/:id ────────────────────────────

  describe('DELETE /api/v1/orgs/me/members/:memberId', () => {
    let memberIdToRemove: number;
    let ownerUserId: number;

    beforeAll(async () => {
      // Get members to find the member we added
      const membersRes = await authGet(app, ownerToken, '/api/v1/orgs/me/members').expect(200);
      const member = membersRes.body.find((m: any) => m.email === 'member@test.com');
      memberIdToRemove = member.id;
      const owner = membersRes.body.find((m: any) => m.email === 'owner@test.com');
      ownerUserId = owner.id;
    });

    it('should return 400 for self-delete', async () => {
      const res = await authDelete(app, ownerToken, `/api/v1/orgs/me/members/${ownerUserId}`);
      expect(res.status).toBe(400);
    });

    it('should return 403 when non-owner tries to remove', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'member@test.com', password: 'password123' })
        .expect(201);
      // Switch to Test Org if needed
      let memberToken = loginRes.body.accessToken;
      const orgs = loginRes.body.orgs;
      const testOrg = orgs.find((o: any) => o.name === 'Test Org');
      if (testOrg && loginRes.body.org.name !== 'Test Org') {
        const switchRes = await request(app.getHttpServer())
          .post('/auth/switch-org')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({ orgId: testOrg.id })
          .expect(201);
        memberToken = switchRes.body.accessToken;
      }

      const res = await authDelete(app, memberToken, `/api/v1/orgs/me/members/${ownerUserId}`);
      expect(res.status).toBe(403);
    });

    it('should remove a member successfully', async () => {
      const res = await authDelete(app, ownerToken, `/api/v1/orgs/me/members/${memberIdToRemove}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify removed from members list
      const membersRes = await authGet(app, ownerToken, '/api/v1/orgs/me/members').expect(200);
      const found = membersRes.body.find((m: any) => m.id === memberIdToRemove);
      expect(found).toBeUndefined();
    });
  });
});
