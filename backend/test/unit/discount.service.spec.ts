import { DiscountService } from '../../src/discount/discount.service';

describe('DiscountService', () => {
  let service: DiscountService;
  let mockPrisma: {
    redemption: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      redemption: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new DiscountService(mockPrisma as any);
  });

  describe('validate', () => {
    it('should return valid for existing unused code', async () => {
      mockPrisma.redemption.findUnique.mockResolvedValue({
        id: 1,
        projectId: 1,
        discountAmount: 5,
        used: false,
      });

      const result = await service.validate(1, 'PIONTS-ABC-123');
      expect(result).toEqual({
        valid: true,
        discount_amount: 5,
        already_used: false,
      });
    });

    it('should return valid with already_used for used code', async () => {
      mockPrisma.redemption.findUnique.mockResolvedValue({
        id: 1,
        projectId: 1,
        discountAmount: 10,
        used: true,
      });

      const result = await service.validate(1, 'PIONTS-ABC-456');
      expect(result).toEqual({
        valid: true,
        discount_amount: 10,
        already_used: true,
      });
    });

    it('should return invalid for non-existent code', async () => {
      mockPrisma.redemption.findUnique.mockResolvedValue(null);

      const result = await service.validate(1, 'NONEXISTENT');
      expect(result).toEqual({ valid: false });
    });

    it('should return invalid for code from another project', async () => {
      mockPrisma.redemption.findUnique.mockResolvedValue({
        id: 1,
        projectId: 2,
        discountAmount: 5,
        used: false,
      });

      const result = await service.validate(1, 'PIONTS-OTHER-123');
      expect(result).toEqual({ valid: false });
    });
  });

  describe('markUsed', () => {
    it('should mark unused code as used', async () => {
      mockPrisma.redemption.findUnique.mockResolvedValue({
        id: 1,
        projectId: 1,
        used: false,
      });
      mockPrisma.redemption.update.mockResolvedValue({});

      const result = await service.markUsed(1, 'PIONTS-ABC-123');
      expect(result).toEqual({ success: true });
      expect(mockPrisma.redemption.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { used: true },
      });
    });

    it('should be idempotent for already used code', async () => {
      mockPrisma.redemption.findUnique.mockResolvedValue({
        id: 1,
        projectId: 1,
        used: true,
      });

      const result = await service.markUsed(1, 'PIONTS-ABC-123');
      expect(result).toEqual({ success: true });
      expect(mockPrisma.redemption.update).not.toHaveBeenCalled();
    });

    it('should return failure for non-existent code', async () => {
      mockPrisma.redemption.findUnique.mockResolvedValue(null);

      const result = await service.markUsed(1, 'NONEXISTENT');
      expect(result).toEqual({ success: false });
    });

    it('should return failure for code from another project', async () => {
      mockPrisma.redemption.findUnique.mockResolvedValue({
        id: 1,
        projectId: 2,
        used: false,
      });

      const result = await service.markUsed(1, 'PIONTS-OTHER-123');
      expect(result).toEqual({ success: false });
    });
  });
});
