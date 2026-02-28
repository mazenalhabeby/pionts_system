/**
 * Shared camelCase → snake_case transformers for API responses.
 * Prisma returns camelCase; frontends expect snake_case.
 */

export function toSnakeCaseCustomer(c: any) {
  return {
    id: c.id,
    shopify_customer_id: c.shopifyCustomerId,
    email: c.email,
    name: c.name,
    referral_code: c.referralCode,
    referred_by: c.referredBy,
    points_balance: c.pointsBalance,
    points_earned_total: c.pointsEarnedTotal,
    order_count: c.orderCount,
    signup_rewarded: c.signupRewarded,
    first_order_rewarded: c.firstOrderRewarded,
    followed_tiktok: c.followedTiktok,
    followed_instagram: c.followedInstagram,
    birthday: c.birthday,
    birthday_rewarded_year: c.birthdayRewardedYear,
    is_partner: c.isPartner ?? false,
    partner_commission_pct: c.partnerCommissionPct ? Number(c.partnerCommissionPct) : null,
    created_at: c.createdAt,
    last_activity: c.lastActivity,
  };
}

export function toSnakeCaseRedemption(r: any) {
  return {
    id: r.id,
    points_spent: r.pointsSpent,
    discount_amount: r.discountAmount,
    discount_code: r.discountCode,
    used: !!r.used,
    created_at: r.createdAt,
  };
}

export function toSnakeCaseLog(l: any) {
  return {
    points: l.points,
    type: l.type,
    description: l.description,
    order_id: l.orderId,
    created_at: l.createdAt,
  };
}

export function extractName(...parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join(' ');
}
