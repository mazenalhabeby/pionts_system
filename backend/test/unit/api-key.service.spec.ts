import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyService } from '../../src/auth/api-key.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createPrismaMock, PrismaMock } from '../mocks/prisma.mock';

describe('ApiKeyService', () => {
  let service: ApiKeyService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ApiKeyService>(ApiKeyService);
  });

  describe('generateKeyPair', () => {
    it('should generate keys with correct prefixes', async () => {
      prisma.apiKey.createMany.mockResolvedValue({ count: 2 });

      const result = await service.generateKeyPair(1);

      expect(result.publicKey).toMatch(/^pk_live_/);
      expect(result.secretKey).toMatch(/^sk_live_/);
    });

    it('should store SHA-256 hashes in database', async () => {
      prisma.apiKey.createMany.mockResolvedValue({ count: 2 });

      await service.generateKeyPair(1);

      const call = prisma.apiKey.createMany.mock.calls[0][0];
      const data = call.data as any[];
      // Hashes should be 64-char hex strings
      expect(data[0].keyHash).toMatch(/^[a-f0-9]{64}$/);
      expect(data[1].keyHash).toMatch(/^[a-f0-9]{64}$/);
      // Raw key should NOT be stored
      expect(data[0].keyHash).not.toContain('pk_live_');
    });

    it('should store 12-char prefix for display', async () => {
      prisma.apiKey.createMany.mockResolvedValue({ count: 2 });

      const result = await service.generateKeyPair(1);

      const call = prisma.apiKey.createMany.mock.calls[0][0];
      const data = call.data as any[];
      expect(data[0].keyPrefix.length).toBe(12);
      expect(data[0].keyPrefix).toBe(result.publicKey.substring(0, 12));
    });
  });

  describe('validateKey', () => {
    it('should return project for a valid key', async () => {
      const mockProject = { id: 1, name: 'Test' };
      prisma.apiKey.findFirst.mockResolvedValue({ id: 1, project: mockProject });

      const result = await service.validateKey('pk_live_abc123', 'public');

      expect(result).toEqual(mockProject);
      expect(prisma.apiKey.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          type: 'public',
          revoked: false,
        }),
        include: { project: true },
      });
    });

    it('should return null for non-matching key', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(null);

      const result = await service.validateKey('pk_live_invalid', 'public');

      expect(result).toBeNull();
    });

    it('should not match revoked keys (via query filter)', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(null);

      await service.validateKey('pk_live_revoked', 'public');

      expect(prisma.apiKey.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ revoked: false }),
        }),
      );
    });
  });

  describe('revokeKey', () => {
    it('should set revoked to true', async () => {
      prisma.apiKey.update.mockResolvedValue({ id: 5, revoked: true });

      await service.revokeKey(5);

      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { revoked: true },
      });
    });
  });

  describe('listKeys', () => {
    it('should return keys for a project', async () => {
      const mockKeys = [
        { id: 1, type: 'public', keyPrefix: 'pk_live_abc1', label: 'Default', revoked: false, createdAt: new Date() },
        { id: 2, type: 'secret', keyPrefix: 'sk_live_abc1', label: 'Default', revoked: false, createdAt: new Date() },
      ];
      prisma.apiKey.findMany.mockResolvedValue(mockKeys);

      const result = await service.listKeys(1);

      expect(result).toHaveLength(2);
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { projectId: 1 },
        select: expect.objectContaining({
          id: true, type: true, keyPrefix: true,
        }),
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
