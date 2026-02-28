import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from '../../src/config/app-config.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { DEFAULTS } from '../../src/config/config.constants';
import { createPrismaMock, PrismaMock } from '../mocks/prisma.mock';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppConfigService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
  });

  describe('loadSettingsForProject', () => {
    it('should load existing settings and create missing defaults', async () => {
      prisma.setting.findMany.mockResolvedValue([
        { key: 'min_order_referral', value: '25' },
      ]);
      prisma.setting.create.mockResolvedValue({});

      await service.loadSettingsForProject(1);

      // Should only create missing keys, not the existing one
      const createCalls = prisma.setting.create.mock.calls;
      const createdKeys = createCalls.map((c: any) => c[0].data.key);
      expect(createdKeys).not.toContain('min_order_referral');
      // Should create all other default keys
      expect(createCalls.length).toBe(Object.keys(DEFAULTS).length - 1);
    });

    it('should cache loaded settings', async () => {
      prisma.setting.findMany.mockResolvedValue([
        { key: 'min_order_referral', value: '25' },
      ]);
      prisma.setting.create.mockResolvedValue({});

      await service.loadSettingsForProject(1);

      // get() should return cached value, not default
      expect(service.get(1, 'min_order_referral')).toBe('25');
    });
  });

  describe('get / getInt', () => {
    it('should return default when project not loaded', () => {
      expect(service.get(999, 'min_order_referral')).toBe('10');
    });

    it('should return "0" for unknown keys', () => {
      expect(service.get(999, 'nonexistent_key')).toBe('0');
    });

    it('should parse int correctly', () => {
      expect(service.getInt(999, 'min_order_referral')).toBe(10);
    });
  });

  describe('saveAll', () => {
    it('should only save known keys', async () => {
      prisma.setting.findMany.mockResolvedValue([]);
      prisma.setting.create.mockResolvedValue({});
      prisma.setting.upsert.mockResolvedValue({});

      await service.loadSettingsForProject(1);
      await service.saveAll(1, {
        min_order_referral: '50',
        unknown_key: '999',
      });

      // Should upsert min_order_referral
      expect(prisma.setting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId_key: { projectId: 1, key: 'min_order_referral' } },
          update: { value: '50' },
        }),
      );

      // Should NOT upsert unknown_key
      const upsertKeys = prisma.setting.upsert.mock.calls.map(
        (c: any) => c[0].where.projectId_key.key,
      );
      expect(upsertKeys).not.toContain('unknown_key');
    });

    it('should update the cache after saving', async () => {
      prisma.setting.findMany.mockResolvedValue([]);
      prisma.setting.create.mockResolvedValue({});
      prisma.setting.upsert.mockResolvedValue({});

      await service.loadSettingsForProject(1);
      await service.saveAll(1, { min_order_referral: '99' });

      expect(service.get(1, 'min_order_referral')).toBe('99');
    });
  });

  describe('getRedemptionTiers', () => {
    it('should return tiers from the database via prisma.redemptionTier.findMany', async () => {
      prisma.redemptionTier.findMany.mockResolvedValue([
        { id: 1, projectId: 1, points: 50, discount: 2, sortOrder: 0 },
        { id: 2, projectId: 1, points: 100, discount: 5, sortOrder: 1 },
        { id: 3, projectId: 1, points: 200, discount: 10, sortOrder: 2 },
        { id: 4, projectId: 1, points: 400, discount: 20, sortOrder: 3 },
      ]);

      const tiers = await service.getRedemptionTiers(1);

      expect(prisma.redemptionTier.findMany).toHaveBeenCalledWith({
        where: { projectId: 1 },
        orderBy: { sortOrder: 'asc' },
      });
      expect(tiers).toHaveLength(4);
      expect(tiers[0]).toEqual({ id: 1, points: 50, discount: 2, sort_order: 0 });
      expect(tiers[1]).toEqual({ id: 2, points: 100, discount: 5, sort_order: 1 });
      expect(tiers[2]).toEqual({ id: 3, points: 200, discount: 10, sort_order: 2 });
      expect(tiers[3]).toEqual({ id: 4, points: 400, discount: 20, sort_order: 3 });
    });

    it('should return empty array when no tiers exist', async () => {
      prisma.redemptionTier.findMany.mockResolvedValue([]);

      const tiers = await service.getRedemptionTiers(1);

      expect(tiers).toHaveLength(0);
    });
  });

  describe('getGamificationTiers', () => {
    it('should parse JSON tiers from settings', async () => {
      const tiersJson = JSON.stringify([
        { label: 'Bronze', threshold: 0, multiplier: 1 },
        { label: 'Silver', threshold: 200, multiplier: 1.5 },
      ]);
      prisma.setting.findMany.mockResolvedValue([
        { key: 'gamification_tiers', value: tiersJson },
      ]);
      prisma.setting.create.mockResolvedValue({});

      await service.loadSettingsForProject(1);
      const tiers = service.getGamificationTiers(1);

      expect(tiers).toHaveLength(2);
      expect(tiers[0]).toEqual({ label: 'Bronze', threshold: 0, multiplier: 1 });
      expect(tiers[1]).toEqual({ label: 'Silver', threshold: 200, multiplier: 1.5 });
    });

    it('should return default tiers for invalid JSON', () => {
      const tiers = service.getGamificationTiers(999);

      expect(tiers).toHaveLength(3);
      expect(tiers[0].label).toBe('Bronze');
      expect(tiers[1].label).toBe('Silver');
      expect(tiers[2].label).toBe('Gold');
    });
  });

  describe('getDefaults', () => {
    it('should return a copy of defaults', () => {
      const defaults = service.getDefaults();
      expect(defaults).toEqual(DEFAULTS);
      // Should be a copy, not the same reference
      const testKey = Object.keys(DEFAULTS)[0];
      defaults[testKey] = '999';
      expect(DEFAULTS[testKey]).not.toBe('999');
    });
  });
});
