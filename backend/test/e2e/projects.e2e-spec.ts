import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../helpers/test-app.helper';
import { resetDatabase, disconnectTestPrisma, testPrisma } from '../helpers/prisma-test.helper';
import { registerUser, loginUser, authGet, authPost, authPut, authDelete } from '../helpers/auth.helper';
import { resetCounters } from '../helpers/factories';

describe('Projects E2E', () => {
  let app: INestApplication;
  let userAToken: string;
  let userBToken: string;
  let firstProjectId: number;
  let userBProjectId: number;

  beforeAll(async () => {
    await resetDatabase();
    resetCounters();
    app = await createTestApp();

    // Register user A
    const { body: bodyA } = await registerUser(app, {
      email: 'userA@test.com',
      password: 'password123',
      name: 'User A',
      orgName: 'Org A',
    });
    userAToken = bodyA.accessToken;
    firstProjectId = bodyA.project.id;

    // Register user B (separate org)
    const { body: bodyB } = await registerUser(app, {
      email: 'userB@test.com',
      password: 'password123',
      name: 'User B',
      orgName: 'Org B',
    });
    userBToken = bodyB.accessToken;
    userBProjectId = bodyB.project.id;
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestPrisma();
  });

  // ── CREATE ────────────────────────────────────────────────────────

  describe('POST /api/v1/projects', () => {
    it('should create a project and return project + API keys', async () => {
      const res = await authPost(app, userAToken, '/api/v1/projects', {
        name: 'Second Project',
        domain: 'second.com',
      }).expect(201);

      expect(res.body.project.name).toBe('Second Project');
      expect(res.body.project.domain).toBe('second.com');
      expect(res.body.project.status).toBe('active');
      expect(res.body.apiKeys.publicKey).toMatch(/^pk_live_/);
      expect(res.body.apiKeys.secretKey).toMatch(/^sk_live_/);
    });

    it('should initialize default settings for new project', async () => {
      const projects = await authGet(app, userAToken, '/api/v1/projects').expect(200);
      const secondProject = projects.body.find((p: any) => p.name === 'Second Project');

      const settings = await testPrisma.setting.findMany({
        where: { projectId: secondProject.id },
      });
      expect(settings.length).toBeGreaterThan(0);
    });

    it('should return 400 for missing name', async () => {
      const res = await authPost(app, userAToken, '/api/v1/projects', { domain: 'x.com' });
      expect(res.status).toBe(400);
    });
  });

  // ── LIST ──────────────────────────────────────────────────────────

  describe('GET /api/v1/projects', () => {
    it('should list projects (excludes archived)', async () => {
      const res = await authGet(app, userAToken, '/api/v1/projects').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2); // first + second
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('customerCount');
      expect(res.body[0]).toHaveProperty('keyCount');
    });

    it('should return 401 without token', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/projects');
      expect(res.status).toBe(401);
    });
  });

  // ── GET BY ID ─────────────────────────────────────────────────────

  describe('GET /api/v1/projects/:id', () => {
    it('should return project detail', async () => {
      const res = await authGet(app, userAToken, `/api/v1/projects/${firstProjectId}`).expect(200);

      expect(res.body.id).toBe(firstProjectId);
      expect(res.body.name).toBeDefined();
      expect(res.body.status).toBe('active');
    });

    it('should return 403 for other org project', async () => {
      const res = await authGet(app, userAToken, `/api/v1/projects/${userBProjectId}`);
      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent project', async () => {
      const res = await authGet(app, userAToken, '/api/v1/projects/99999');
      expect(res.status).toBe(404);
    });
  });

  // ── UPDATE ────────────────────────────────────────────────────────

  describe('PUT /api/v1/projects/:id', () => {
    it('should update project name and domain', async () => {
      const res = await authPut(app, userAToken, `/api/v1/projects/${firstProjectId}`, {
        name: 'Renamed Project',
        domain: 'renamed.com',
      }).expect(200);

      expect(res.body.name).toBe('Renamed Project');
      expect(res.body.domain).toBe('renamed.com');
    });
  });

  // ── ARCHIVE ───────────────────────────────────────────────────────

  describe('DELETE /api/v1/projects/:id', () => {
    let archivableProjectId: number;

    beforeAll(async () => {
      // Create a project specifically for archiving
      const res = await authPost(app, userAToken, '/api/v1/projects', {
        name: 'To Archive',
      }).expect(201);
      archivableProjectId = res.body.project.id;
    });

    it('should archive project and exclude from list', async () => {
      await authDelete(app, userAToken, `/api/v1/projects/${archivableProjectId}`).expect(200);

      // Verify excluded from list
      const listRes = await authGet(app, userAToken, '/api/v1/projects').expect(200);
      const found = listRes.body.find((p: any) => p.id === archivableProjectId);
      expect(found).toBeUndefined();
    });
  });

  // ── API KEYS ──────────────────────────────────────────────────────

  describe('API Key management', () => {
    it('POST /api/v1/projects/:id/keys — should generate new key pair', async () => {
      const res = await authPost(app, userAToken, `/api/v1/projects/${firstProjectId}/keys`)
        .expect(201);

      expect(res.body.publicKey).toMatch(/^pk_live_/);
      expect(res.body.secretKey).toMatch(/^sk_live_/);
    });

    it('GET /api/v1/projects/:id/keys — should list keys', async () => {
      const res = await authGet(app, userAToken, `/api/v1/projects/${firstProjectId}/keys`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body[0]).toHaveProperty('type');
      expect(res.body[0]).toHaveProperty('keyPrefix');
    });

    it('DELETE /api/v1/projects/:id/keys/:keyId — should revoke key', async () => {
      // Get keys first
      const keysRes = await authGet(app, userAToken, `/api/v1/projects/${firstProjectId}/keys`)
        .expect(200);
      const keyToRevoke = keysRes.body[0];

      await authDelete(app, userAToken, `/api/v1/projects/${firstProjectId}/keys/${keyToRevoke.id}`)
        .expect(200);

      // Verify revoked
      const keysAfter = await authGet(app, userAToken, `/api/v1/projects/${firstProjectId}/keys`)
        .expect(200);
      const revoked = keysAfter.body.find((k: any) => k.id === keyToRevoke.id);
      expect(revoked.revoked).toBe(true);
    });
  });

  // ── CROSS-ORG ISOLATION ───────────────────────────────────────────

  describe('Cross-org isolation', () => {
    it('user A cannot access user B project', async () => {
      const res = await authGet(app, userAToken, `/api/v1/projects/${userBProjectId}`);
      expect(res.status).toBe(403);
    });

    it('user A cannot list user B keys', async () => {
      const res = await authGet(app, userAToken, `/api/v1/projects/${userBProjectId}/keys`);
      expect(res.status).toBe(403);
    });

    it('user B cannot update user A project', async () => {
      const res = await authPut(app, userBToken, `/api/v1/projects/${firstProjectId}`, {
        name: 'Hacked',
      });
      expect(res.status).toBe(403);
    });
  });

  // ── PROJECT MEMBER MANAGEMENT ──────────────────────────────────────

  describe('Project member management', () => {
    let memberUserId: number;
    let memberToken: string;

    beforeAll(async () => {
      // Add a member to Org A
      await authPost(app, userAToken, '/api/v1/orgs/me/members', {
        email: 'memberA@test.com',
        password: 'password123',
        name: 'Member A',
        role: 'member',
      }).expect(201);

      // Login as the member
      const { body } = await loginUser(app, 'memberA@test.com', 'password123');
      memberToken = body.accessToken;

      // Get user ID from /auth/me (response is flat: { id, email, ... })
      const meRes = await authGet(app, memberToken, '/auth/me').expect(200);
      memberUserId = meRes.body.id;
    });

    it('member without project membership cannot access project', async () => {
      const res = await authGet(app, memberToken, `/api/v1/projects/${firstProjectId}`);
      expect(res.status).toBe(403);
    });

    it('member without membership sees empty project list', async () => {
      const res = await authGet(app, memberToken, '/api/v1/projects').expect(200);
      expect(res.body).toEqual([]);
    });

    it('owner can add member to project', async () => {
      const res = await authPost(app, userAToken, `/api/v1/projects/${firstProjectId}/members`, {
        userId: memberUserId,
        role: 'editor',
      }).expect(201);

      expect(res.body.role).toBe('editor');
      expect(res.body.user.email).toBe('memberA@test.com');
    });

    it('member with membership can now access project', async () => {
      const res = await authGet(app, memberToken, `/api/v1/projects/${firstProjectId}`).expect(200);
      expect(res.body.id).toBe(firstProjectId);
    });

    it('member sees only assigned projects in list', async () => {
      const res = await authGet(app, memberToken, '/api/v1/projects').expect(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(firstProjectId);
    });

    it('owner can list project members', async () => {
      const res = await authGet(app, userAToken, `/api/v1/projects/${firstProjectId}/members`).expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('owner can update member role', async () => {
      const res = await authPut(app, userAToken, `/api/v1/projects/${firstProjectId}/members/${memberUserId}`, {
        role: 'viewer',
      }).expect(200);

      expect(res.body.role).toBe('viewer');
    });

    it('viewer cannot update project (needs admin)', async () => {
      const res = await authPut(app, memberToken, `/api/v1/projects/${firstProjectId}`, {
        name: 'Should Fail',
      });
      expect(res.status).toBe(403);
    });

    it('owner can remove member from project', async () => {
      const res = await authDelete(app, userAToken, `/api/v1/projects/${firstProjectId}/members/${memberUserId}`)
        .expect(200);
      expect(res.body.success).toBe(true);
    });

    it('removed member can no longer access project', async () => {
      const res = await authGet(app, memberToken, `/api/v1/projects/${firstProjectId}`);
      expect(res.status).toBe(403);
    });
  });

  // ── PROJECT OWNERSHIP & TRANSFER ────────────────────────────────────

  describe('Project ownership & transfer', () => {
    let ownershipProjectId: number;
    let memberUserId: number;
    let memberToken: string;
    let userAId: number;

    beforeAll(async () => {
      // Create a project for ownership tests
      const res = await authPost(app, userAToken, '/api/v1/projects', {
        name: 'Ownership Test',
      }).expect(201);
      ownershipProjectId = res.body.project.id;

      // Get user A's ID
      const meRes = await authGet(app, userAToken, '/auth/me').expect(200);
      userAId = meRes.body.id;

      // Add a member to Org A (re-use or create)
      try {
        await authPost(app, userAToken, '/api/v1/orgs/me/members', {
          email: 'transferMember@test.com',
          password: 'password123',
          name: 'Transfer Member',
          role: 'member',
        }).expect(201);
      } catch {
        // member may already exist
      }

      // Login as the member
      const { body } = await loginUser(app, 'transferMember@test.com', 'password123');
      memberToken = body.accessToken;

      const memberMe = await authGet(app, memberToken, '/auth/me').expect(200);
      memberUserId = memberMe.body.id;

      // Add member to the ownership project as admin
      await authPost(app, userAToken, `/api/v1/projects/${ownershipProjectId}/members`, {
        userId: memberUserId,
        role: 'admin',
      }).expect(201);
    });

    it('project creator gets owner role in member list', async () => {
      const res = await authGet(app, userAToken, `/api/v1/projects/${ownershipProjectId}/members`).expect(200);
      const ownerMember = res.body.find((m: any) => m.userId === userAId);
      expect(ownerMember).toBeDefined();
      expect(ownerMember.role).toBe('owner');
    });

    it('project list includes owner role', async () => {
      const res = await authGet(app, userAToken, '/api/v1/projects').expect(200);
      const proj = res.body.find((p: any) => p.id === ownershipProjectId);
      expect(proj).toBeDefined();
      expect(proj.projectRole).toBe('owner');
    });

    it('cannot change owner role via updateRole', async () => {
      const res = await authPut(app, userAToken, `/api/v1/projects/${ownershipProjectId}/members/${userAId}`, {
        role: 'admin',
      });
      expect(res.status).toBe(400);
    });

    it('cannot remove project owner', async () => {
      const res = await authDelete(app, userAToken, `/api/v1/projects/${ownershipProjectId}/members/${userAId}`);
      expect(res.status).toBe(400);
    });

    it('admin (non-owner) cannot transfer ownership', async () => {
      const res = await authPost(app, memberToken, `/api/v1/projects/${ownershipProjectId}/transfer-ownership`, {
        userId: memberUserId,
      });
      expect(res.status).toBe(403);
    });

    it('owner can transfer ownership to another member', async () => {
      const res = await authPost(app, userAToken, `/api/v1/projects/${ownershipProjectId}/transfer-ownership`, {
        userId: memberUserId,
      }).expect(201);

      expect(res.body.success).toBe(true);

      // Verify: new owner has 'owner' role, old owner has 'admin'
      const members = await authGet(app, userAToken, `/api/v1/projects/${ownershipProjectId}/members`).expect(200);
      const newOwner = members.body.find((m: any) => m.userId === memberUserId);
      const oldOwner = members.body.find((m: any) => m.userId === userAId);

      expect(newOwner.role).toBe('owner');
      expect(oldOwner.role).toBe('admin');
    });

    it('org owner can transfer on any project (escape hatch)', async () => {
      // User A is org owner — transfer back from memberUserId to userAId
      const res = await authPost(app, userAToken, `/api/v1/projects/${ownershipProjectId}/transfer-ownership`, {
        userId: userAId,
      }).expect(201);

      expect(res.body.success).toBe(true);

      // Verify restoration
      const members = await authGet(app, userAToken, `/api/v1/projects/${ownershipProjectId}/members`).expect(200);
      const restored = members.body.find((m: any) => m.userId === userAId);
      expect(restored.role).toBe('owner');
    });
  });
});
