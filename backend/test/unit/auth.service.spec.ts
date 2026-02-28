import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/auth/auth.service';
import { ApiKeyService } from '../../src/auth/api-key.service';
import { AppConfigService } from '../../src/config/app-config.service';
import { EarnActionsService } from '../../src/earn-actions/earn-actions.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createPrismaMock, PrismaMock } from '../mocks/prisma.mock';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaMock;
  let jwtService: JwtService;

  const mockApiKeyService = {
    generateKeyPair: jest.fn().mockResolvedValue({
      publicKey: 'pk_live_test',
      secretKey: 'sk_live_test',
    }),
  };

  const mockConfigService = {
    loadSettingsForProject: jest.fn().mockResolvedValue(undefined),
  };

  const mockEarnActionsService = {
    seedDefaultActions: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: new JwtService({ secret: 'test-jwt-secret' }) },
        { provide: ApiKeyService, useValue: mockApiKeyService },
        { provide: AppConfigService, useValue: mockConfigService },
        { provide: EarnActionsService, useValue: mockEarnActionsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('register', () => {
    it('should create org, user, project, owner membership, and keys', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue({ id: 1, name: 'Test', slug: 'test-abc' });
      prisma.user.create.mockResolvedValue({
        id: 1, orgId: 1, email: 'test@test.com', name: 'Test', role: 'owner', passwordHash: 'h',
      });
      prisma.project.create.mockResolvedValue({ id: 1, orgId: 1, name: 'Test Rewards' });
      prisma.projectMember.create.mockResolvedValue({ id: 1, projectId: 1, userId: 1, role: 'owner' });
      prisma.subscription.create.mockResolvedValue({ id: 1, orgId: 1 });

      const result = await service.register('test@test.com', 'password123', 'Test', 'Test');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('test@test.com');
      expect(result.org.id).toBe(1);
      expect(result.project.id).toBe(1);
      expect(result.apiKeys.publicKey).toBe('pk_live_test');
      expect(prisma.organization.create).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.project.create).toHaveBeenCalled();
      expect(prisma.projectMember.create).toHaveBeenCalledWith({
        data: { projectId: 1, userId: 1, role: 'owner' },
      });
      expect(mockApiKeyService.generateKeyPair).toHaveBeenCalledWith(1);
      expect(mockConfigService.loadSettingsForProject).toHaveBeenCalledWith(1);
    });

    it('should hash the password with bcrypt', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue({ id: 1, name: 'T', slug: 't-abc' });
      prisma.user.create.mockImplementation(async ({ data }) => {
        expect(data.passwordHash).not.toBe('password123');
        const isValid = await bcrypt.compare('password123', data.passwordHash);
        expect(isValid).toBe(true);
        return { id: 1, orgId: 1, email: data.email, name: data.name, role: 'owner', passwordHash: data.passwordHash };
      });
      prisma.project.create.mockResolvedValue({ id: 1, orgId: 1, name: 'T Rewards' });
      prisma.projectMember.create.mockResolvedValue({ id: 1, projectId: 1, userId: 1, role: 'owner' });
      prisma.subscription.create.mockResolvedValue({ id: 1, orgId: 1 });

      await service.register('hash@test.com', 'password123', undefined, 'T');
    });

    it('should generate slug from org name', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockImplementation(async ({ data }) => {
        expect(data.slug).toMatch(/^my-cool-org-/);
        return { id: 1, name: data.name, slug: data.slug };
      });
      prisma.user.create.mockResolvedValue({
        id: 1, orgId: 1, email: 'test@test.com', name: null, role: 'owner', passwordHash: 'h',
      });
      prisma.project.create.mockResolvedValue({ id: 1, orgId: 1, name: 'R' });
      prisma.projectMember.create.mockResolvedValue({ id: 1, projectId: 1, userId: 1, role: 'owner' });
      prisma.subscription.create.mockResolvedValue({ id: 1, orgId: 1 });

      await service.register('test@test.com', 'password123', undefined, 'My Cool Org!');
    });

    it('should throw ConflictException for duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'dup@test.com' });

      await expect(
        service.register('dup@test.com', 'password123', 'Dup', 'Org'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const hash = await bcrypt.hash('password123', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 1, orgId: 1, email: 'test@test.com', name: 'Test', role: 'owner',
        passwordHash: hash,
        org: { id: 1, name: 'Org', slug: 'org' },
      });

      const result = await service.login('test@test.com', 'password123');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('test@test.com');
      expect(result.org.name).toBe('Org');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('nobody@test.com', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('correct', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 1, email: 'test@test.com', passwordHash: hash,
        org: { id: 1, name: 'Org', slug: 'org' },
      });

      await expect(service.login('test@test.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should return new tokens from a valid refresh token', async () => {
      const refreshToken = jwtService.sign(
        { sub: 1, orgId: 1, email: 'test@test.com', role: 'owner' },
        { secret: process.env.JWT_REFRESH_SECRET || 'test-refresh-secret', expiresIn: '7d' },
      );

      prisma.user.findUnique.mockResolvedValue({
        id: 1, orgId: 1, email: 'test@test.com', role: 'owner',
      });

      const result = await service.refresh(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const refreshToken = jwtService.sign(
        { sub: 999, orgId: 1, email: 'gone@test.com', role: 'owner' },
        { secret: process.env.JWT_REFRESH_SECRET || 'test-refresh-secret', expiresIn: '7d' },
      );

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });
});
