import {
  toSnakeCaseCustomer,
  toSnakeCaseRedemption,
  toSnakeCaseLog,
  extractName,
} from '../../src/utils/transformers';

describe('Transformers', () => {
  describe('toSnakeCaseCustomer', () => {
    it('should convert all camelCase fields to snake_case', () => {
      const input = {
        id: 1,
        shopifyCustomerId: 'S123',
        email: 'test@test.com',
        name: 'Test',
        referralCode: 'ABC123',
        referredBy: 'XYZ789',
        pointsBalance: 100,
        pointsEarnedTotal: 200,
        orderCount: 5,
        signupRewarded: true,
        firstOrderRewarded: false,
        followedTiktok: true,
        followedInstagram: false,
        birthday: '1990-01-01',
        birthdayRewardedYear: 2024,
        createdAt: new Date('2024-01-01'),
        lastActivity: new Date('2024-06-01'),
      };

      const result = toSnakeCaseCustomer(input);

      expect(result).toEqual({
        id: 1,
        shopify_customer_id: 'S123',
        email: 'test@test.com',
        name: 'Test',
        referral_code: 'ABC123',
        referred_by: 'XYZ789',
        points_balance: 100,
        points_earned_total: 200,
        order_count: 5,
        signup_rewarded: true,
        first_order_rewarded: false,
        followed_tiktok: true,
        followed_instagram: false,
        birthday: '1990-01-01',
        birthday_rewarded_year: 2024,
        is_partner: false,
        partner_commission_pct: null,
        created_at: input.createdAt,
        last_activity: input.lastActivity,
      });
    });

    it('should handle null/undefined fields gracefully', () => {
      const result = toSnakeCaseCustomer({
        id: 1,
        shopifyCustomerId: null,
        email: 'x@x.com',
        name: null,
        referralCode: 'A',
        referredBy: null,
      });

      expect(result.shopify_customer_id).toBeNull();
      expect(result.name).toBeNull();
      expect(result.referred_by).toBeNull();
    });
  });

  describe('toSnakeCaseRedemption', () => {
    it('should convert redemption fields', () => {
      const input = {
        id: 1,
        pointsSpent: 50,
        discountAmount: 5,
        discountCode: 'CODE1',
        used: false,
        createdAt: new Date('2024-01-01'),
      };

      const result = toSnakeCaseRedemption(input);

      expect(result).toEqual({
        id: 1,
        points_spent: 50,
        discount_amount: 5,
        discount_code: 'CODE1',
        used: false,
        created_at: input.createdAt,
      });
    });

    it('should coerce used to boolean', () => {
      expect(toSnakeCaseRedemption({ used: 1 }).used).toBe(true);
      expect(toSnakeCaseRedemption({ used: 0 }).used).toBe(false);
      expect(toSnakeCaseRedemption({ used: null }).used).toBe(false);
    });
  });

  describe('toSnakeCaseLog', () => {
    it('should convert log fields', () => {
      const input = {
        points: 10,
        type: 'purchase',
        description: 'Test',
        orderId: 'ORD-1',
        createdAt: new Date('2024-01-01'),
      };

      const result = toSnakeCaseLog(input);

      expect(result).toEqual({
        points: 10,
        type: 'purchase',
        description: 'Test',
        order_id: 'ORD-1',
        created_at: input.createdAt,
      });
    });
  });

  describe('extractName', () => {
    it('should join non-null parts with space', () => {
      expect(extractName('John', 'Doe')).toBe('John Doe');
    });

    it('should filter out null/undefined parts', () => {
      expect(extractName('John', null, undefined)).toBe('John');
    });

    it('should return empty string for all null/undefined', () => {
      expect(extractName(null, undefined)).toBe('');
    });

    it('should handle single name', () => {
      expect(extractName('Alice')).toBe('Alice');
    });
  });
});
