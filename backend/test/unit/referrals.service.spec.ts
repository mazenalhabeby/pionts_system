import { Test, TestingModule } from '@nestjs/testing';
import { ReferralsService } from '../../src/referrals/referrals.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppConfigService } from '../../src/config/app-config.service';
import { CustomersService } from '../../src/customers/customers.service';
import { createPrismaMock, PrismaMock } from '../mocks/prisma.mock';

describe('ReferralsService', () => {
  let service: ReferralsService;
  let prisma: PrismaMock;
  let mockCustomersService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    prisma = createPrismaMock();

    mockCustomersService = {
      findByReferralCode: jest.fn(),
      setReferredBy: jest.fn(),
    };

    mockConfigService = {
      getInt: jest.fn().mockReturnValue(50), // max_direct_referrals
      getReferralLevels: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppConfigService, useValue: mockConfigService },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    service = module.get<ReferralsService>(ReferralsService);
  });

  describe('linkReferral', () => {
    it('should create tree entry with parentId only (no grandparentId)', async () => {
      mockCustomersService.findByReferralCode.mockResolvedValue({ id: 10, referralCode: 'PARENT' });
      prisma.referralTree.count.mockResolvedValue(0); // directCount
      prisma.referralTree.findUnique.mockResolvedValueOnce(null); // existing tree for the customer

      prisma.referralTree.create.mockResolvedValue({});
      mockCustomersService.setReferredBy.mockResolvedValue(undefined);

      const result = await service.linkReferral(1, 20, 'PARENT');

      expect(result).toBe(true);
      expect(prisma.referralTree.create).toHaveBeenCalledWith({
        data: {
          projectId: 1,
          customerId: 20,
          parentId: 10,
        },
      });
      expect(mockCustomersService.setReferredBy).toHaveBeenCalledWith(20, 'PARENT');
    });

    it('should return false if referrer not found', async () => {
      mockCustomersService.findByReferralCode.mockResolvedValue(null);

      const result = await service.linkReferral(1, 20, 'INVALID');
      expect(result).toBe(false);
    });

    it('should return false if referral limit reached', async () => {
      mockCustomersService.findByReferralCode.mockResolvedValue({ id: 10 });
      prisma.referralTree.count.mockResolvedValue(50); // at limit

      const result = await service.linkReferral(1, 20, 'CODE');
      expect(result).toBe(false);
    });

    it('should return false if customer already has a tree entry', async () => {
      mockCustomersService.findByReferralCode.mockResolvedValue({ id: 10 });
      prisma.referralTree.count.mockResolvedValue(0);
      prisma.referralTree.findUnique.mockResolvedValueOnce({ id: 1 }); // existing

      const result = await service.linkReferral(1, 20, 'CODE');
      expect(result).toBe(false);
    });
  });

  describe('getReferralStats', () => {
    it('should return direct and network counts', async () => {
      prisma.referralTree.count.mockResolvedValueOnce(5); // direct
      prisma.$queryRaw.mockResolvedValueOnce([{ count: BigInt(8) }]); // network (recursive CTE)

      const stats = await service.getReferralStats(1, 10);

      expect(stats).toEqual({ direct: 5, network: 8 });
    });
  });

  describe('getDirectCount', () => {
    it('should count by parentId', async () => {
      prisma.referralTree.count.mockResolvedValue(3);

      const result = await service.getDirectCount(1, 10);

      expect(result).toBe(3);
      expect(prisma.referralTree.count).toHaveBeenCalledWith({
        where: { projectId: 1, parentId: 10 },
      });
    });
  });

  describe('getNetworkCount', () => {
    it('should use recursive CTE to count all descendants', async () => {
      prisma.$queryRaw.mockResolvedValue([{ count: BigInt(7) }]);

      const result = await service.getNetworkCount(1, 10);

      expect(result).toBe(7);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });
  });

  describe('getReferralEarnings', () => {
    it('should sum all referral_l* points', async () => {
      prisma.pointsLog.aggregate.mockResolvedValue({ _sum: { points: 42 } });

      const result = await service.getReferralEarnings(1, 10);

      expect(result).toBe(42);
      expect(prisma.pointsLog.aggregate).toHaveBeenCalledWith({
        where: {
          projectId: 1,
          customerId: 10,
          type: { startsWith: 'referral_l' },
        },
        _sum: { points: true },
      });
    });

    it('should return 0 when no earnings', async () => {
      prisma.pointsLog.aggregate.mockResolvedValue({ _sum: { points: null } });

      const result = await service.getReferralEarnings(1, 10);
      expect(result).toBe(0);
    });
  });

  describe('walkUpline', () => {
    it('should walk up the referral chain N levels', async () => {
      // Customer 30 -> Parent 20 -> Grandparent 10
      prisma.referralTree.findUnique
        .mockResolvedValueOnce({ parentId: 20, customerId: 30 }) // level 2
        .mockResolvedValueOnce({ parentId: 10, customerId: 20 }) // level 3
        .mockResolvedValueOnce(null); // no more

      const upline = await service.walkUpline(1, 30, 3);

      expect(upline).toEqual([
        { customerId: 20, level: 2 },
        { customerId: 10, level: 3 },
      ]);
    });

    it('should stop when no more parents found', async () => {
      prisma.referralTree.findUnique.mockResolvedValueOnce(null);

      const upline = await service.walkUpline(1, 30, 5);

      expect(upline).toEqual([]);
    });
  });
});
