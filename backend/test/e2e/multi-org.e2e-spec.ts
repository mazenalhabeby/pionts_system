import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { resetDatabase, disconnectTestPrisma, testPrisma } from '../helpers/prisma-test.helper';
import { registerUser, loginUser, authGet, authPost } from '../helpers/auth.helper';
import { resetCounters } from '../helpers/factories';

describe('Multi-Org E2E', () => {
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

  let userAToken: string;
  let orgAId: number;
  let orgBId: number;
  let userBToken: string;

  describe('Multi-org membership flow', () => {
    it('Step 1: User A registers (creates Org A)', async () => {
      const { body } = await registerUser(app, {
        email: 'alice@test.com',
        password: 'password123',
        name: 'Alice',
        orgName: 'Org A',
      });
      userAToken = body.accessToken;
      orgAId = body.org.id;

      expect(body.orgs).toHaveLength(1);
      expect(body.orgs[0].name).toBe('Org A');
      expect(body.orgs[0].role).toBe('owner');
    });

    it('Step 2: User B registers (creates Org B)', async () => {
      const { body } = await registerUser(app, {
        email: 'bob@test.com',
        password: 'password123',
        name: 'Bob',
        orgName: 'Org B',
      });
      userBToken = body.accessToken;
      orgBId = body.org.id;

      expect(body.orgs).toHaveLength(1);
      expect(body.orgs[0].name).toBe('Org B');
    });

    it('Step 3: User B adds User A to Org B as member', async () => {
      const res = await authPost(app, userBToken, '/api/v1/orgs/me/members', {
        email: 'alice@test.com',
        role: 'member',
      }).expect(201);

      expect(res.body.email).toBe('alice@test.com');
      expect(res.body.role).toBe('member');
    });

    it('Step 4: User A now has 2 org memberships', async () => {
      // Re-login to get fresh token
      const { body: loginBody } = await loginUser(app, 'alice@test.com', 'password123');
      userAToken = loginBody.accessToken;

      expect(loginBody.orgs).toHaveLength(2);
      const orgNames = loginBody.orgs.map((o: any) => o.name).sort();
      expect(orgNames).toEqual(['Org A', 'Org B']);
    });

    it('Step 5: GET /auth/me returns orgs array', async () => {
      const res = await authGet(app, userAToken, '/auth/me').expect(200);

      expect(res.body.orgs).toHaveLength(2);
      expect(res.body.org).toBeDefined();
    });

    it('Step 6: User A can switch to Org B', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/switch-org')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ orgId: orgBId })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.org.id).toBe(orgBId);
      expect(res.body.org.name).toBe('Org B');
      expect(res.body.role).toBe('member');

      // Save the new token for subsequent requests
      userAToken = res.body.accessToken;
    });

    it('Step 7: After switch, User A sees Org B context (member role = no projects unless assigned)', async () => {
      const res = await authGet(app, userAToken, '/api/v1/projects').expect(200);

      // User A is a member (not owner) in Org B, so they see only projects
      // they're explicitly assigned to as ProjectMember. Since none were assigned,
      // the list should be empty.
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);

      // Verify we're in Org B context via /auth/me
      const meRes = await authGet(app, userAToken, '/auth/me').expect(200);
      expect(meRes.body.org.id).toBe(orgBId);
    });

    it('Step 8: User A cannot switch to non-member org', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/switch-org')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ orgId: 9999 })
        .expect(403);

      expect(res.body.error).toBeDefined();
    });

    it('Step 9: User A switches back to Org A', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/switch-org')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ orgId: orgAId })
        .expect(201);

      expect(res.body.org.id).toBe(orgAId);
      expect(res.body.role).toBe('owner');
      userAToken = res.body.accessToken;
    });

    it('Step 10: After switching back, User A sees only Org A projects', async () => {
      const res = await authGet(app, userAToken, '/api/v1/projects').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('Step 11: User B removes User A from Org B', async () => {
      // Get Alice's user ID
      const membersRes = await authGet(app, userBToken, '/api/v1/orgs/me/members').expect(200);
      const alice = membersRes.body.find((m: any) => m.email === 'alice@test.com');
      expect(alice).toBeDefined();

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/orgs/me/members/${alice.id}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('Step 12: User A still exists and can access Org A', async () => {
      // Re-login as Alice
      const { body: loginBody } = await loginUser(app, 'alice@test.com', 'password123');
      userAToken = loginBody.accessToken;

      // Should have only 1 org now
      expect(loginBody.orgs).toHaveLength(1);
      expect(loginBody.orgs[0].name).toBe('Org A');

      // Can still access Org A data
      const res = await authGet(app, userAToken, '/api/v1/orgs/me').expect(200);
      expect(res.body.name).toBe('Org A');
    });

    it('Step 13: User A can no longer switch to Org B', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/switch-org')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ orgId: orgBId })
        .expect(403);

      expect(res.body.error).toBeDefined();
    });
  });
});
