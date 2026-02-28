import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomersService, FLAG_MAP } from '../../src/customers/customers.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ReferralCodeService } from '../../src/utils/referral-code.service';
import { AppConfigService } from '../../src/config/app-config.service';
import { NotificationService } from '../../src/notifications/notification.service';
import { BillingService } from '../../src/billing/billing.service';
import { createPrismaMock, PrismaMock } from '../mocks/prisma.mock';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: PrismaMock;

  const mockReferralCodeService = {
    generate: jest.fn().mockResolvedValue('ABC123'),
  };

  const mockAppConfigService = {
    get: jest.fn().mockReturnValue('10'),
    getNumber: jest.fn().mockReturnValue(10),
  };

  const mockNotificationService = {
    sendWelcome: jest.fn(),
    sendPointsEarned: jest.fn(),
  };

  const mockBillingService = {
    canCreateCustomer: jest.fn().mockResolvedValue(undefined),
    trackCustomerCount: jest.fn(),
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: prisma },
        { provide: ReferralCodeService, useValue: mockReferralCodeService },
        { provide: AppConfigService, useValue: mockAppConfigService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: BillingService, useValue: mockBillingService },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  describe('findByEmail', () => {
    it('should find customer by project and email', async () => {
      const mockCustomer = { id: 1, projectId: 1, email: 'test@test.com' };
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await service.findByEmail(1, 'test@test.com');

      expect(result).toEqual(mockCustomer);
      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { projectId_email: { projectId: 1, email: 'test@test.com' } },
      });
    });
  });

  describe('findById', () => {
    it('should find customer with matching projectId', async () => {
      const mockCustomer = { id: 1, projectId: 1 };
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await service.findById(1, 1);
      expect(result).toEqual(mockCustomer);
    });

    it('should return null for wrong projectId (tenant isolation)', async () => {
      prisma.customer.findUnique.mockResolvedValue({ id: 1, projectId: 2 });

      const result = await service.findById(1, 1);
      expect(result).toBeNull();
    });

    it('should return null when customer not found', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      const result = await service.findById(1, 999);
      expect(result).toBeNull();
    });
  });

  describe('getOrCreate', () => {
    it('should return existing customer', async () => {
      const existing = { id: 1, projectId: 1, email: 'x@test.com', name: 'X', shopifyCustomerId: null };
      prisma.customer.findUnique.mockResolvedValue(existing);

      const result = await service.getOrCreate(1, 'x@test.com');
      expect(result).toEqual(existing);
    });

    it('should create new customer when not found', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      const newCustomer = { id: 2, projectId: 1, email: 'new@test.com', referralCode: 'ABC123' };
      prisma.customer.create.mockResolvedValue(newCustomer);

      const result = await service.getOrCreate(1, 'new@test.com', 'New');

      expect(result).toEqual(newCustomer);
      expect(mockReferralCodeService.generate).toHaveBeenCalledWith(1);
    });

    it('should update name if missing on existing customer', async () => {
      const existing = { id: 1, projectId: 1, email: 'x@test.com', name: '', shopifyCustomerId: null };
      prisma.customer.findUnique.mockResolvedValue(existing);
      prisma.customer.update.mockResolvedValue({ ...existing, name: 'Updated' });

      const result = await service.getOrCreate(1, 'x@test.com', 'Updated');
      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated' },
      });
    });
  });

  describe('awardPoints', () => {
    it('should create log entry and update balance in transaction', async () => {
      prisma.$transaction.mockResolvedValue([
        { id: 1 }, // pointsLog
        { id: 1, pointsBalance: 30 }, // updated customer
      ]);

      const result = await service.awardPoints(1, 1, 20, 'signup', 'Welcome!');

      expect(result).toBe(30);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('deductPoints', () => {
    it('should create negative log entry and decrement balance', async () => {
      prisma.$transaction.mockResolvedValue([
        { id: 2 },
        { id: 1, pointsBalance: 80 },
      ]);

      const result = await service.deductPoints(1, 1, 20, 'redeem', 'Redeemed');

      expect(result).toBe(80);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('setFlag / isFlagSet', () => {
    it('should set a known flag', async () => {
      prisma.customer.update.mockResolvedValue({});

      await service.setFlag(1, 'signup_rewarded');

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { signupRewarded: true },
      });
    });

    it('should ignore unknown flags', async () => {
      await service.setFlag(1, 'unknown_flag');
      expect(prisma.customer.update).not.toHaveBeenCalled();
    });

    it('should check if flag is set', () => {
      const customer = { signupRewarded: true, followedTiktok: false };
      expect(service.isFlagSet(customer, 'signup_rewarded')).toBe(true);
      expect(service.isFlagSet(customer, 'followed_tiktok')).toBe(false);
    });

    it('should return false for unknown flag', () => {
      expect(service.isFlagSet({}, 'unknown')).toBe(false);
    });
  });

  describe('searchCustomers', () => {
    it('should build query with search filter', async () => {
      prisma.customer.findMany.mockResolvedValue([]);
      prisma.customer.count.mockResolvedValue(0);

      await service.searchCustomers(1, 'alice');

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: 1,
            OR: expect.arrayContaining([
              { email: { contains: 'alice', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should map sort fields correctly', async () => {
      prisma.customer.findMany.mockResolvedValue([]);
      prisma.customer.count.mockResolvedValue(0);

      await service.searchCustomers(1, undefined, 'points_balance', 'desc');

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { pointsBalance: 'desc' },
        }),
      );
    });

    it('should cap limit at 200', async () => {
      prisma.customer.findMany.mockResolvedValue([]);
      prisma.customer.count.mockResolvedValue(0);

      await service.searchCustomers(1, undefined, undefined, undefined, 500);

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 200 }),
      );
    });

    it('should default sort to id desc', async () => {
      prisma.customer.findMany.mockResolvedValue([]);
      prisma.customer.count.mockResolvedValue(0);

      await service.searchCustomers(1);

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { id: 'desc' },
        }),
      );
    });
  });

  describe('getStats', () => {
    it('should aggregate stats from multiple queries', async () => {
      prisma.customer.count.mockResolvedValue(100);
      prisma.customer.aggregate.mockResolvedValue({ _sum: { pointsEarnedTotal: 5000 } });
      prisma.processedOrder.count.mockResolvedValue(50);
      prisma.redemption.aggregate.mockResolvedValue({ _sum: { discountAmount: 200 } });

      const result = await service.getStats(1);

      expect(result).toEqual({
        totalCustomers: 100,
        totalPoints: 5000,
        totalOrders: 50,
        totalRedeemed: 200,
      });
    });

    it('should default null sums to 0', async () => {
      prisma.customer.count.mockResolvedValue(0);
      prisma.customer.aggregate.mockResolvedValue({ _sum: { pointsEarnedTotal: null } });
      prisma.processedOrder.count.mockResolvedValue(0);
      prisma.redemption.aggregate.mockResolvedValue({ _sum: { discountAmount: null } });

      const result = await service.getStats(1);

      expect(result.totalPoints).toBe(0);
      expect(result.totalRedeemed).toBe(0);
    });
  });

  describe('resolveFromSession', () => {
    it('should throw NotFoundException when session has no email', async () => {
      await expect(service.resolveFromSession(1, {})).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when customer not found', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      await expect(
        service.resolveFromSession(1, { customerEmail: 'gone@test.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return customer when found', async () => {
      const customer = { id: 1, email: 'found@test.com' };
      prisma.customer.findUnique.mockResolvedValue(customer);

      const result = await service.resolveFromSession(1, { customerEmail: 'found@test.com' });
      expect(result).toEqual(customer);
    });
  });
});
