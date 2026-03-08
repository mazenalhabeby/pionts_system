export const DEFAULTS: Record<string, string> = {
  // Anti-abuse
  min_order_referral: '10',
  max_direct_referrals: '50',
  points_expiry_months: '12',
  // Referral discount (still a setting — applies globally)
  referral_discount_percent: '5',
  // Partner reward type
  partner_reward_type: 'points',
  // Social follow verification
  social_follow_claim_delay: '30',
  // Widget appearance
  widget_primary_color: '#ff3c00',
  widget_bg_color: '#f5f5f5',
  widget_text_color: '#1a1a1a',
  widget_brand_name: '',
  // Social URLs (still needed for widget display)
  social_tiktok_url: '',
  social_instagram_url: '',
  referral_base_url: '',
  // Gamification tiers (JSON array: [{label,threshold,multiplier}])
  gamification_enabled: 'true',
  gamification_tiers: JSON.stringify([
    { label: 'Bronze', threshold: 0, multiplier: 1 },
    { label: 'Silver', threshold: 200, multiplier: 1.5 },
    { label: 'Gold', threshold: 500, multiplier: 2 },
  ]),
  leaderboard_enabled: 'true',
  // Discount code prefix (defaults to project name, set on project creation)
  discount_code_prefix: '',
  // Email notifications
  email_notification_mode: 'instant',
  email_welcome_enabled: 'true',
  email_referral_enabled: 'true',
  email_from_name: '',
};
