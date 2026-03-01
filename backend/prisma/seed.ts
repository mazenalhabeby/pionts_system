import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function dt(daysAgo: number, hoursAgo = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d;
}

function hashKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

async function clearAll() {
  console.log('Clearing existing data...');
  await prisma.partnerEarning.deleteMany();
  await prisma.customerActionLog.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.pointsLog.deleteMany();
  await prisma.referralTree.deleteMany();
  await prisma.redemption.deleteMany();
  await prisma.processedOrder.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.earnAction.deleteMany();
  await prisma.redemptionTier.deleteMany();
  await prisma.referralLevel.deleteMany();
  await prisma.emailQueue.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.project.deleteMany();
  await prisma.orgMembership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const tables = [
    'organizations', 'users', 'org_memberships', 'projects', 'customers', 'api_keys',
    'referral_tree', 'points_log', 'redemptions', 'processed_orders',
    'settings', 'email_queue', 'subscriptions', 'project_members',
    'earn_actions', 'customer_action_log', 'redemption_tiers', 'referral_levels', 'partner_earnings',
  ];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE IF EXISTS ${table}_id_seq RESTART WITH 1`);
  }
}

async function seedBrewBean() {
  console.log('\n── Seeding Brew & Bean Co ──');

  const org = await prisma.organization.create({
    data: { name: 'Brew & Bean Co', slug: 'brew-bean' },
  });

  const passwordHash = await bcrypt.hash('admin', 10);
  const memberHash = await bcrypt.hash('member', 10);

  const owner = await prisma.user.create({
    data: { email: 'admin@brewbean.com', passwordHash, name: 'Marcus Rivera' },
  });
  await prisma.orgMembership.create({ data: { userId: owner.id, orgId: org.id, role: 'owner' } });

  const member = await prisma.user.create({
    data: { email: 'barista@brewbean.com', passwordHash: memberHash, name: 'Jade Thompson' },
  });
  await prisma.orgMembership.create({ data: { userId: member.id, orgId: org.id, role: 'member' } });

  // API keys (declared early so hmacSecret can reference secKey)
  const pubKey = 'pk_live_brew_test_public_key_001';
  const secKey = 'sk_live_brew_test_secret_key_001';

  const project = await prisma.project.create({
    data: {
      orgId: org.id, name: 'Brew Rewards', domain: 'brewbean.com', platform: 'custom',
      pointsEnabled: true, referralsEnabled: true, partnersEnabled: true,
      hmacSecret: secKey,
    },
  });
  const pid = project.id;

  // Project member
  await prisma.projectMember.create({ data: { projectId: pid, userId: member.id, role: 'editor' } });
  await prisma.apiKey.createMany({
    data: [
      { projectId: pid, type: 'public', keyHash: hashKey(pubKey), keyPrefix: pubKey.substring(0, 12), label: 'Default' },
      { projectId: pid, type: 'secret', keyHash: hashKey(secKey), keyPrefix: secKey.substring(0, 12), label: 'Default' },
    ],
  });

  // Earn actions
  console.log('  Earn actions...');
  await prisma.earnAction.createMany({
    data: [
      { projectId: pid, slug: 'signup', label: 'Sign up', points: 25, category: 'predefined', frequency: 'one_time', sortOrder: 0 },
      { projectId: pid, slug: 'purchase', label: 'Every purchase', points: 15, category: 'predefined', frequency: 'repeatable', sortOrder: 1 },
      { projectId: pid, slug: 'first_order', label: 'First order bonus', points: 75, category: 'predefined', frequency: 'one_time', sortOrder: 2 },
      { projectId: pid, slug: 'review_photo', label: 'Photo review', points: 15, category: 'predefined', frequency: 'repeatable', sortOrder: 3 },
      { projectId: pid, slug: 'review_text', label: 'Text review', points: 8, category: 'predefined', frequency: 'repeatable', sortOrder: 4 },
      { projectId: pid, slug: 'share_product', label: 'Share a product', points: 5, category: 'predefined', frequency: 'repeatable', sortOrder: 5 },
      { projectId: pid, slug: 'birthday', label: 'Birthday bonus', points: 30, category: 'predefined', frequency: 'yearly', sortOrder: 6 },
      { projectId: pid, slug: 'follow_tiktok', label: 'Follow on TikTok', points: 10, category: 'social_follow', frequency: 'one_time', sortOrder: 7 },
      { projectId: pid, slug: 'follow_instagram', label: 'Follow on Instagram', points: 10, category: 'social_follow', frequency: 'one_time', sortOrder: 8 },
      { projectId: pid, slug: 'coffee_survey', label: 'Coffee preference survey', points: 20, category: 'custom', frequency: 'one_time', sortOrder: 9 },
      { projectId: pid, slug: 'app_download', label: 'Download mobile app', points: 30, category: 'custom', frequency: 'one_time', enabled: false, sortOrder: 10 },
    ],
  });

  // Redemption tiers
  await prisma.redemptionTier.createMany({
    data: [
      { projectId: pid, points: 50, discount: 3, sortOrder: 0 },
      { projectId: pid, points: 100, discount: 6, sortOrder: 1 },
      { projectId: pid, points: 200, discount: 12, sortOrder: 2 },
      { projectId: pid, points: 400, discount: 25, sortOrder: 3 },
      { projectId: pid, points: 800, discount: 55, sortOrder: 4 },
    ],
  });

  // Referral levels
  await prisma.referralLevel.createMany({
    data: [
      { projectId: pid, level: 1, points: 10 },
      { projectId: pid, level: 2, points: 8 },
      { projectId: pid, level: 3, points: 3 },
    ],
  });

  // ── 30 Customers ──
  console.log('  Customers...');
  const c = await Promise.all([
    // 0: Olivia — top referrer, partner
    prisma.customer.create({ data: { projectId: pid, email: 'olivia@test.com', name: 'Olivia Martinez', referralCode: 'OLV8M3', pointsBalance: 620, pointsEarnedTotal: 1280, orderCount: 18, signupRewarded: true, firstOrderRewarded: true, followedTiktok: true, followedInstagram: true, birthday: '1992-04-12', birthdayRewardedYear: 2026, emailVerified: true, isPartner: true, partnerCommissionPct: 12, partnerCreditBalance: 85.40, createdAt: dt(110), lastActivity: dt(0, 1) } }),
    // 1: Liam — partner
    prisma.customer.create({ data: { projectId: pid, email: 'liam@test.com', name: 'Liam Nakamura', referralCode: 'LM4N7K', pointsBalance: 340, pointsEarnedTotal: 890, orderCount: 14, signupRewarded: true, firstOrderRewarded: true, followedTiktok: true, followedInstagram: true, birthday: '1988-11-30', birthdayRewardedYear: 2026, emailVerified: true, isPartner: true, partnerCommissionPct: 10, partnerCreditBalance: 42.00, createdAt: dt(105), lastActivity: dt(0, 3) } }),
    // 2: Aisha
    prisma.customer.create({ data: { projectId: pid, email: 'aisha@test.com', name: 'Aisha Patel', referralCode: 'AP2R6D', pointsBalance: 480, pointsEarnedTotal: 720, orderCount: 10, signupRewarded: true, firstOrderRewarded: true, followedTiktok: true, emailVerified: true, createdAt: dt(95), lastActivity: dt(1) } }),
    // 3: Noah — referred by Olivia
    prisma.customer.create({ data: { projectId: pid, email: 'noah@example.com', name: 'Noah Kim', referralCode: 'NK9T2B', referredBy: 'OLV8M3', pointsBalance: 185, pointsEarnedTotal: 285, orderCount: 5, signupRewarded: true, firstOrderRewarded: true, followedTiktok: true, emailVerified: true, createdAt: dt(80), lastActivity: dt(2) } }),
    // 4: Sofia — referred by Olivia
    prisma.customer.create({ data: { projectId: pid, email: 'sofia@example.com', name: 'Sofia Reyes', referralCode: 'SR3W7H', referredBy: 'OLV8M3', pointsBalance: 120, pointsEarnedTotal: 170, orderCount: 3, signupRewarded: true, firstOrderRewarded: true, emailVerified: true, createdAt: dt(72), lastActivity: dt(5) } }),
    // 5: Ethan — referred by Olivia
    prisma.customer.create({ data: { projectId: pid, email: 'ethan@example.com', name: 'Ethan Clarke', referralCode: 'EC5J8P', referredBy: 'OLV8M3', pointsBalance: 90, pointsEarnedTotal: 115, orderCount: 2, signupRewarded: true, firstOrderRewarded: true, emailVerified: true, createdAt: dt(65), lastActivity: dt(8) } }),
    // 6: Mila — referred by Olivia
    prisma.customer.create({ data: { projectId: pid, email: 'mila@example.com', name: 'Mila Johansson', referralCode: 'MJ6K1N', referredBy: 'OLV8M3', pointsBalance: 45, pointsEarnedTotal: 45, orderCount: 0, signupRewarded: true, emailVerified: true, createdAt: dt(30), lastActivity: dt(30) } }),
    // 7: Diego — referred by Olivia
    prisma.customer.create({ data: { projectId: pid, email: 'diego@example.com', name: 'Diego Santos', referralCode: 'DS8Q4V', referredBy: 'OLV8M3', pointsBalance: 195, pointsEarnedTotal: 345, orderCount: 7, signupRewarded: true, firstOrderRewarded: true, followedTiktok: true, followedInstagram: true, emailVerified: true, createdAt: dt(75), lastActivity: dt(0, 6) } }),
    // 8: Hana — referred by Noah (grandchild of Olivia)
    prisma.customer.create({ data: { projectId: pid, email: 'hana@example.com', name: 'Hana Yilmaz', referralCode: 'HY2L5F', referredBy: 'NK9T2B', pointsBalance: 110, pointsEarnedTotal: 160, orderCount: 3, signupRewarded: true, firstOrderRewarded: true, emailVerified: true, createdAt: dt(55), lastActivity: dt(3) } }),
    // 9: Lucas — referred by Noah
    prisma.customer.create({ data: { projectId: pid, email: 'lucas@example.com', name: 'Lucas Ferreira', referralCode: 'LF7M3R', referredBy: 'NK9T2B', pointsBalance: 65, pointsEarnedTotal: 65, orderCount: 1, signupRewarded: true, emailVerified: true, createdAt: dt(40), lastActivity: dt(15) } }),
    // 10: Amara — referred by Diego (grandchild of Olivia)
    prisma.customer.create({ data: { projectId: pid, email: 'amara@example.com', name: 'Amara Okafor', referralCode: 'AO4P8X', referredBy: 'DS8Q4V', pointsBalance: 130, pointsEarnedTotal: 180, orderCount: 4, signupRewarded: true, firstOrderRewarded: true, emailVerified: true, createdAt: dt(50), lastActivity: dt(1, 4) } }),
    // 11: Kai — referred by Hana (great-grandchild of Olivia)
    prisma.customer.create({ data: { projectId: pid, email: 'kai@example.com', name: 'Kai Tanaka', referralCode: 'KT6R9W', referredBy: 'HY2L5F', pointsBalance: 40, pointsEarnedTotal: 40, orderCount: 1, signupRewarded: true, emailVerified: true, createdAt: dt(25), lastActivity: dt(12) } }),
    // 12: Zara — referred by Liam
    prisma.customer.create({ data: { projectId: pid, email: 'zara@example.com', name: 'Zara Ahmed', referralCode: 'ZA3S7G', referredBy: 'LM4N7K', pointsBalance: 155, pointsEarnedTotal: 230, orderCount: 5, signupRewarded: true, firstOrderRewarded: true, followedInstagram: true, emailVerified: true, createdAt: dt(70), lastActivity: dt(2, 3) } }),
    // 13: Oscar — referred by Liam
    prisma.customer.create({ data: { projectId: pid, email: 'oscar@example.com', name: 'Oscar Lindgren', referralCode: 'OL5D2C', referredBy: 'LM4N7K', pointsBalance: 80, pointsEarnedTotal: 105, orderCount: 2, signupRewarded: true, firstOrderRewarded: true, emailVerified: true, createdAt: dt(58), lastActivity: dt(10) } }),
    // 14: Isla — referred by Liam
    prisma.customer.create({ data: { projectId: pid, email: 'isla@example.com', name: 'Isla Murphy', referralCode: 'IM8E4T', referredBy: 'LM4N7K', pointsBalance: 100, pointsEarnedTotal: 150, orderCount: 3, signupRewarded: true, firstOrderRewarded: true, emailVerified: true, createdAt: dt(62), lastActivity: dt(4) } }),
    // 15: Ravi — referred by Liam
    prisma.customer.create({ data: { projectId: pid, email: 'ravi@example.com', name: 'Ravi Gupta', referralCode: 'RG1F6Y', referredBy: 'LM4N7K', pointsBalance: 35, pointsEarnedTotal: 35, orderCount: 0, signupRewarded: true, emailVerified: true, createdAt: dt(22), lastActivity: dt(22) } }),
    // 16: Yuki — referred by Zara (grandchild of Liam)
    prisma.customer.create({ data: { projectId: pid, email: 'yuki@example.com', name: 'Yuki Sato', referralCode: 'YS9H2K', referredBy: 'ZA3S7G', pointsBalance: 55, pointsEarnedTotal: 80, orderCount: 1, signupRewarded: true, emailVerified: true, createdAt: dt(35), lastActivity: dt(9) } }),
    // 17: Felix — referred by Aisha
    prisma.customer.create({ data: { projectId: pid, email: 'felix@example.com', name: 'Felix Weber', referralCode: 'FW4J8M', referredBy: 'AP2R6D', pointsBalance: 90, pointsEarnedTotal: 115, orderCount: 2, signupRewarded: true, firstOrderRewarded: true, emailVerified: true, createdAt: dt(60), lastActivity: dt(7) } }),
    // 18: Chloe — referred by Aisha
    prisma.customer.create({ data: { projectId: pid, email: 'chloe@example.com', name: 'Chloe Dubois', referralCode: 'CD7K3N', referredBy: 'AP2R6D', pointsBalance: 145, pointsEarnedTotal: 195, orderCount: 4, signupRewarded: true, firstOrderRewarded: true, followedTiktok: true, emailVerified: true, createdAt: dt(68), lastActivity: dt(1, 8) } }),
    // 19: Tariq — referred by Aisha
    prisma.customer.create({ data: { projectId: pid, email: 'tariq@example.com', name: 'Tariq Hassan', referralCode: 'TH2L9P', referredBy: 'AP2R6D', pointsBalance: 25, pointsEarnedTotal: 25, orderCount: 0, signupRewarded: true, emailVerified: true, createdAt: dt(18), lastActivity: dt(18) } }),
    // 20: Ines — referred by Chloe (grandchild of Aisha)
    prisma.customer.create({ data: { projectId: pid, email: 'ines@example.com', name: 'Ines Moreau', referralCode: 'IN5M6Q', referredBy: 'CD7K3N', pointsBalance: 70, pointsEarnedTotal: 95, orderCount: 2, signupRewarded: true, firstOrderRewarded: true, emailVerified: true, createdAt: dt(42), lastActivity: dt(6) } }),
    // 21: James — independent, loyal
    prisma.customer.create({ data: { projectId: pid, email: 'james@example.com', name: "James O'Brien", referralCode: 'JO8N4R', pointsBalance: 210, pointsEarnedTotal: 360, orderCount: 8, signupRewarded: true, firstOrderRewarded: true, followedTiktok: true, followedInstagram: true, birthday: '1985-08-20', birthdayRewardedYear: 2026, emailVerified: true, createdAt: dt(100), lastActivity: dt(0, 4) } }),
    // 22: Leila — moderate
    prisma.customer.create({ data: { projectId: pid, email: 'leila@example.com', name: 'Leila Bergström', referralCode: 'LB3P7S', pointsBalance: 95, pointsEarnedTotal: 120, orderCount: 2, signupRewarded: true, firstOrderRewarded: true, emailVerified: true, createdAt: dt(48), lastActivity: dt(11) } }),
    // 23: Chen — active buyer
    prisma.customer.create({ data: { projectId: pid, email: 'chen@example.com', name: 'Chen Wei', referralCode: 'CW6Q2T', pointsBalance: 160, pointsEarnedTotal: 260, orderCount: 6, signupRewarded: true, firstOrderRewarded: true, followedInstagram: true, emailVerified: true, createdAt: dt(88), lastActivity: dt(1, 2) } }),
    // 24: Maria — new signup
    prisma.customer.create({ data: { projectId: pid, email: 'maria@example.com', name: 'Maria Rossi', referralCode: 'MR9R5U', pointsBalance: 30, pointsEarnedTotal: 30, orderCount: 0, signupRewarded: true, emailVerified: true, createdAt: dt(3), lastActivity: dt(3) } }),
    // 25: Kwame
    prisma.customer.create({ data: { projectId: pid, email: 'kwame@example.com', name: 'Kwame Asante', referralCode: 'KA1S8V', pointsBalance: 50, pointsEarnedTotal: 100, orderCount: 2, signupRewarded: true, firstOrderRewarded: true, emailVerified: true, createdAt: dt(52), lastActivity: dt(14) } }),
    // 26: Elena — churned
    prisma.customer.create({ data: { projectId: pid, email: 'elena@example.com', name: 'Elena Volkov', referralCode: 'EV4T1W', pointsBalance: 0, pointsEarnedTotal: 75, orderCount: 1, signupRewarded: true, emailVerified: true, createdAt: dt(115), lastActivity: dt(92) } }),
    // 27: Sam — at risk
    prisma.customer.create({ data: { projectId: pid, email: 'sam@example.com', name: 'Sam Taylor', referralCode: 'ST7U3X', pointsBalance: 15, pointsEarnedTotal: 40, orderCount: 1, signupRewarded: true, emailVerified: true, createdAt: dt(85), lastActivity: dt(46) } }),
    // 28: Noor — just signed up
    prisma.customer.create({ data: { projectId: pid, email: 'noor@example.com', name: 'Noor Al-Rashid', referralCode: 'NA2V6Y', pointsBalance: 25, pointsEarnedTotal: 25, orderCount: 0, signupRewarded: true, emailVerified: true, createdAt: dt(1), lastActivity: dt(1) } }),
    // 29: Freya — just signed up
    prisma.customer.create({ data: { projectId: pid, email: 'freya@example.com', name: 'Freya Andersen', referralCode: 'FA5W9Z', pointsBalance: 35, pointsEarnedTotal: 35, orderCount: 0, signupRewarded: true, emailVerified: true, createdAt: dt(2), lastActivity: dt(2) } }),
  ]);

  const [olivia, liam, aisha, noah, sofia, ethan, mila, diego, hana, lucas,
    amara, kai, zara, oscar, isla, ravi, yuki, felix, chloe, tariq,
    ines, james, leila, chen, maria, kwame, elena, sam, noor, freya] = c;

  // ── Referral Tree ──
  console.log('  Referral tree...');
  await prisma.referralTree.createMany({
    data: [
      // Olivia's direct
      { projectId: pid, customerId: noah.id, parentId: olivia.id },
      { projectId: pid, customerId: sofia.id, parentId: olivia.id },
      { projectId: pid, customerId: ethan.id, parentId: olivia.id },
      { projectId: pid, customerId: mila.id, parentId: olivia.id },
      { projectId: pid, customerId: diego.id, parentId: olivia.id },
      // Noah's referrals (grandchildren of Olivia)
      { projectId: pid, customerId: hana.id, parentId: noah.id },
      { projectId: pid, customerId: lucas.id, parentId: noah.id },
      // Diego's referral
      { projectId: pid, customerId: amara.id, parentId: diego.id },
      // Hana's referral (great-grandchild)
      { projectId: pid, customerId: kai.id, parentId: hana.id },
      // Liam's direct
      { projectId: pid, customerId: zara.id, parentId: liam.id },
      { projectId: pid, customerId: oscar.id, parentId: liam.id },
      { projectId: pid, customerId: isla.id, parentId: liam.id },
      { projectId: pid, customerId: ravi.id, parentId: liam.id },
      // Zara's referral
      { projectId: pid, customerId: yuki.id, parentId: zara.id },
      // Aisha's direct
      { projectId: pid, customerId: felix.id, parentId: aisha.id },
      { projectId: pid, customerId: chloe.id, parentId: aisha.id },
      { projectId: pid, customerId: tariq.id, parentId: aisha.id },
      // Chloe's referral
      { projectId: pid, customerId: ines.id, parentId: chloe.id },
    ],
  });

  // ── Points Logs ──
  console.log('  Points logs...');
  const logs: { cid: number; points: number; type: string; desc: string; orderId: string | null; at: Date }[] = [];
  const log = (cid: number, points: number, type: string, desc: string, orderId: string | null, daysAgo: number, hoursAgo = 0) => {
    logs.push({ cid, points, type, desc, orderId, at: dt(daysAgo, hoursAgo) });
  };

  // Olivia — 18 orders, heavy activity
  log(olivia.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 110);
  log(olivia.id, 15, 'purchase', 'Purchase — Order #B-1001', 'B-1001', 108);
  log(olivia.id, 75, 'first_order', 'First order bonus!', 'B-1001', 108);
  log(olivia.id, 10, 'follow_tiktok', 'Followed on TikTok', null, 106);
  log(olivia.id, 10, 'follow_instagram', 'Followed on Instagram', null, 105);
  log(olivia.id, 15, 'purchase', 'Purchase — Order #B-1005', 'B-1005', 100);
  log(olivia.id, 15, 'purchase', 'Purchase — Order #B-1012', 'B-1012', 90);
  log(olivia.id, 8, 'referral_l2', 'Referral: Noah Kim ordered', 'B-1020', 78);
  log(olivia.id, 15, 'purchase', 'Purchase — Order #B-1018', 'B-1018', 82);
  log(olivia.id, 8, 'referral_l2', 'Referral: Sofia Reyes ordered', 'B-1025', 70);
  log(olivia.id, 15, 'purchase', 'Purchase — Order #B-1028', 'B-1028', 68);
  log(olivia.id, 15, 'review_photo', 'Photo review submitted', null, 66);
  log(olivia.id, -400, 'redeem', 'Redeemed €25 off', null, 65);
  log(olivia.id, 8, 'referral_l2', 'Referral: Ethan Clarke ordered', 'B-1035', 62);
  log(olivia.id, 15, 'purchase', 'Purchase — Order #B-1038', 'B-1038', 58);
  log(olivia.id, 8, 'referral_l2', 'Referral: Diego Santos ordered', 'B-1040', 55);
  log(olivia.id, 3, 'referral_l3', 'Network: Hana Yilmaz ordered', 'B-1052', 48);
  log(olivia.id, 15, 'purchase', 'Purchase — Order #B-1048', 'B-1048', 45);
  log(olivia.id, 5, 'share_product', 'Shared a product', null, 42);
  log(olivia.id, 15, 'purchase', 'Purchase — Order #B-1055', 'B-1055', 40);
  log(olivia.id, 3, 'referral_l3', 'Network: Amara Okafor ordered', 'B-1060', 38);
  log(olivia.id, -200, 'redeem', 'Redeemed €12 off', null, 35);
  log(olivia.id, 15, 'purchase', 'Purchase — Order #B-1065', 'B-1065', 30);
  log(olivia.id, 30, 'birthday', 'Birthday bonus!', null, 28);
  log(olivia.id, 15, 'purchase', 'Purchase — Order #B-1072', 'B-1072', 22);
  log(olivia.id, 8, 'review_text', 'Text review submitted', null, 20);
  log(olivia.id, 15, 'purchase', 'Purchase — Order #B-1080', 'B-1080', 15);
  log(olivia.id, 3, 'referral_l3', 'Network: Lucas Ferreira ordered', 'B-1085', 12);
  log(olivia.id, 15, 'purchase', 'Purchase — Order #B-1088', 'B-1088', 10);
  log(olivia.id, 15, 'purchase', 'Purchase — Order #B-1095', 'B-1095', 5);
  log(olivia.id, 8, 'referral_l2', 'Referral: Noah Kim ordered', 'B-1098', 3);
  log(olivia.id, 15, 'purchase', 'Purchase — Order #B-1102', 'B-1102', 2);
  log(olivia.id, 15, 'purchase', 'Purchase — Order #B-1110', 'B-1110', 1);
  log(olivia.id, 15, 'purchase', 'Purchase — Order #B-1115', 'B-1115', 0, 1);
  log(olivia.id, 20, 'coffee_survey', 'Completed coffee survey', null, 0, 1);

  // Liam — 14 orders
  log(liam.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 105);
  log(liam.id, 15, 'purchase', 'Purchase — Order #B-1002', 'B-1002', 103);
  log(liam.id, 75, 'first_order', 'First order bonus!', 'B-1002', 103);
  log(liam.id, 10, 'follow_tiktok', 'Followed on TikTok', null, 101);
  log(liam.id, 10, 'follow_instagram', 'Followed on Instagram', null, 100);
  log(liam.id, 15, 'purchase', 'Purchase — Order #B-1010', 'B-1010', 92);
  log(liam.id, 15, 'purchase', 'Purchase — Order #B-1016', 'B-1016', 85);
  log(liam.id, 8, 'referral_l2', 'Referral: Zara Ahmed ordered', 'B-1024', 68);
  log(liam.id, 15, 'purchase', 'Purchase — Order #B-1030', 'B-1030', 65);
  log(liam.id, -200, 'redeem', 'Redeemed €12 off', null, 60);
  log(liam.id, 8, 'referral_l2', 'Referral: Oscar Lindgren ordered', 'B-1042', 56);
  log(liam.id, 15, 'purchase', 'Purchase — Order #B-1045', 'B-1045', 50);
  log(liam.id, 15, 'review_photo', 'Photo review submitted', null, 48);
  log(liam.id, 8, 'referral_l2', 'Referral: Isla Murphy ordered', 'B-1050', 44);
  log(liam.id, -100, 'redeem', 'Redeemed €6 off', null, 42);
  log(liam.id, 15, 'purchase', 'Purchase — Order #B-1058', 'B-1058', 38);
  log(liam.id, 3, 'referral_l3', 'Network: Yuki Sato ordered', 'B-1068', 30);
  log(liam.id, 30, 'birthday', 'Birthday bonus!', null, 28);
  log(liam.id, 15, 'purchase', 'Purchase — Order #B-1075', 'B-1075', 20);
  log(liam.id, 5, 'share_product', 'Shared a product', null, 18);
  log(liam.id, 15, 'purchase', 'Purchase — Order #B-1082', 'B-1082', 12);
  log(liam.id, -50, 'redeem', 'Redeemed €3 off (pending)', null, 10);
  log(liam.id, 15, 'purchase', 'Purchase — Order #B-1090', 'B-1090', 7);
  log(liam.id, 8, 'referral_l2', 'Referral: Zara Ahmed ordered', 'B-1100', 4);
  log(liam.id, 15, 'purchase', 'Purchase — Order #B-1105', 'B-1105', 2);
  log(liam.id, 15, 'purchase', 'Purchase — Order #B-1112', 'B-1112', 0, 3);

  // Aisha — 10 orders
  log(aisha.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 95);
  log(aisha.id, 15, 'purchase', 'Purchase — Order #B-1004', 'B-1004', 92);
  log(aisha.id, 75, 'first_order', 'First order bonus!', 'B-1004', 92);
  log(aisha.id, 10, 'follow_tiktok', 'Followed on TikTok', null, 90);
  log(aisha.id, 15, 'purchase', 'Purchase — Order #B-1015', 'B-1015', 82);
  log(aisha.id, 8, 'referral_l2', 'Referral: Felix Weber ordered', 'B-1033', 58);
  log(aisha.id, 8, 'referral_l2', 'Referral: Chloe Dubois ordered', 'B-1036', 55);
  log(aisha.id, -100, 'redeem', 'Redeemed €6 off', null, 52);
  log(aisha.id, 15, 'purchase', 'Purchase — Order #B-1046', 'B-1046', 48);
  log(aisha.id, 3, 'referral_l3', 'Network: Ines Moreau ordered', 'B-1062', 38);
  log(aisha.id, 15, 'purchase', 'Purchase — Order #B-1056', 'B-1056', 42);
  log(aisha.id, 15, 'purchase', 'Purchase — Order #B-1070', 'B-1070', 28);
  log(aisha.id, 8, 'review_text', 'Text review submitted', null, 25);
  log(aisha.id, 15, 'purchase', 'Purchase — Order #B-1078', 'B-1078', 18);
  log(aisha.id, 15, 'purchase', 'Purchase — Order #B-1092', 'B-1092', 8);
  log(aisha.id, 15, 'purchase', 'Purchase — Order #B-1108', 'B-1108', 2);
  log(aisha.id, 15, 'purchase', 'Purchase — Order #B-1113', 'B-1113', 1);

  // Noah
  log(noah.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 80);
  log(noah.id, 15, 'purchase', 'Purchase — Order #B-1020', 'B-1020', 78);
  log(noah.id, 75, 'first_order', 'First order bonus!', 'B-1020', 78);
  log(noah.id, 10, 'follow_tiktok', 'Followed on TikTok', null, 76);
  log(noah.id, 8, 'referral_l2', 'Referral: Hana Yilmaz ordered', 'B-1052', 48);
  log(noah.id, 15, 'purchase', 'Purchase — Order #B-1066', 'B-1066', 30);
  log(noah.id, -100, 'redeem', 'Redeemed €6 off', null, 28);
  log(noah.id, 8, 'referral_l2', 'Referral: Lucas Ferreira ordered', 'B-1085', 12);
  log(noah.id, 15, 'purchase', 'Purchase — Order #B-1086', 'B-1086', 10);
  log(noah.id, 15, 'purchase', 'Purchase — Order #B-1098', 'B-1098', 3);
  log(noah.id, 15, 'purchase', 'Purchase — Order #B-1107', 'B-1107', 2);

  // Sofia
  log(sofia.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 72);
  log(sofia.id, 15, 'purchase', 'Purchase — Order #B-1025', 'B-1025', 70);
  log(sofia.id, 75, 'first_order', 'First order bonus!', 'B-1025', 70);
  log(sofia.id, 15, 'purchase', 'Purchase — Order #B-1057', 'B-1057', 40);
  log(sofia.id, 15, 'purchase', 'Purchase — Order #B-1094', 'B-1094', 5);
  log(sofia.id, 5, 'share_product', 'Shared a product', null, 5);

  // Ethan
  log(ethan.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 65);
  log(ethan.id, 15, 'purchase', 'Purchase — Order #B-1035', 'B-1035', 62);
  log(ethan.id, 75, 'first_order', 'First order bonus!', 'B-1035', 62);

  // Mila
  log(mila.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 30);
  log(mila.id, 20, 'coffee_survey', 'Completed coffee survey', null, 29);

  // Diego — 7 orders
  log(diego.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 75);
  log(diego.id, 15, 'purchase', 'Purchase — Order #B-1040', 'B-1040', 55);
  log(diego.id, 75, 'first_order', 'First order bonus!', 'B-1040', 55);
  log(diego.id, 10, 'follow_tiktok', 'Followed on TikTok', null, 53);
  log(diego.id, 10, 'follow_instagram', 'Followed on Instagram', null, 52);
  log(diego.id, 15, 'purchase', 'Purchase — Order #B-1053', 'B-1053', 45);
  log(diego.id, 8, 'referral_l2', 'Referral: Amara Okafor ordered', 'B-1060', 38);
  log(diego.id, -100, 'redeem', 'Redeemed €6 off', null, 35);
  log(diego.id, 15, 'purchase', 'Purchase — Order #B-1064', 'B-1064', 32);
  log(diego.id, -50, 'redeem', 'Redeemed €3 off', null, 28);
  log(diego.id, 15, 'purchase', 'Purchase — Order #B-1076', 'B-1076', 18);
  log(diego.id, 15, 'review_photo', 'Photo review submitted', null, 15);
  log(diego.id, 15, 'purchase', 'Purchase — Order #B-1091', 'B-1091', 8);
  log(diego.id, 15, 'purchase', 'Purchase — Order #B-1103', 'B-1103', 2);
  log(diego.id, 15, 'purchase', 'Purchase — Order #B-1114', 'B-1114', 0, 6);

  // Hana
  log(hana.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 55);
  log(hana.id, 15, 'purchase', 'Purchase — Order #B-1052', 'B-1052', 48);
  log(hana.id, 75, 'first_order', 'First order bonus!', 'B-1052', 48);
  log(hana.id, 8, 'referral_l2', 'Referral: Kai Tanaka ordered', 'B-1083', 15);
  log(hana.id, 15, 'purchase', 'Purchase — Order #B-1087', 'B-1087', 10);
  log(hana.id, 15, 'purchase', 'Purchase — Order #B-1106', 'B-1106', 3);

  // Lucas
  log(lucas.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 40);
  log(lucas.id, 15, 'purchase', 'Purchase — Order #B-1085', 'B-1085', 12);
  log(lucas.id, 25, 'manual_award', 'Loyalty bonus from support', null, 15);

  // Amara
  log(amara.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 50);
  log(amara.id, 15, 'purchase', 'Purchase — Order #B-1060', 'B-1060', 38);
  log(amara.id, 75, 'first_order', 'First order bonus!', 'B-1060', 38);
  log(amara.id, 15, 'purchase', 'Purchase — Order #B-1077', 'B-1077', 18);
  log(amara.id, 15, 'purchase', 'Purchase — Order #B-1093', 'B-1093', 6);
  log(amara.id, 15, 'purchase', 'Purchase — Order #B-1111', 'B-1111', 1, 4);
  log(amara.id, 5, 'share_product', 'Shared a product', null, 1, 4);

  // Kai
  log(kai.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 25);
  log(kai.id, 15, 'purchase', 'Purchase — Order #B-1083', 'B-1083', 15);

  // Zara
  log(zara.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 70);
  log(zara.id, 15, 'purchase', 'Purchase — Order #B-1024', 'B-1024', 68);
  log(zara.id, 75, 'first_order', 'First order bonus!', 'B-1024', 68);
  log(zara.id, 10, 'follow_instagram', 'Followed on Instagram', null, 66);
  log(zara.id, -50, 'redeem', 'Redeemed €3 off', null, 50);
  log(zara.id, 8, 'referral_l2', 'Referral: Yuki Sato ordered', 'B-1068', 30);
  log(zara.id, 15, 'purchase', 'Purchase — Order #B-1069', 'B-1069', 28);
  log(zara.id, 15, 'purchase', 'Purchase — Order #B-1084', 'B-1084', 12);
  log(zara.id, 15, 'purchase', 'Purchase — Order #B-1100', 'B-1100', 4);
  log(zara.id, 8, 'review_text', 'Text review submitted', null, 2, 3);

  // Oscar
  log(oscar.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 58);
  log(oscar.id, 15, 'purchase', 'Purchase — Order #B-1042', 'B-1042', 56);
  log(oscar.id, 75, 'first_order', 'First order bonus!', 'B-1042', 56);
  log(oscar.id, -10, 'manual_deduct', 'Points adjustment', null, 45);

  // Isla
  log(isla.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 62);
  log(isla.id, 15, 'purchase', 'Purchase — Order #B-1050', 'B-1050', 44);
  log(isla.id, 75, 'first_order', 'First order bonus!', 'B-1050', 44);
  log(isla.id, 15, 'purchase', 'Purchase — Order #B-1074', 'B-1074', 20);
  log(isla.id, 15, 'purchase', 'Purchase — Order #B-1099', 'B-1099', 4);

  // Ravi
  log(ravi.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 22);
  log(ravi.id, 10, 'follow_tiktok', 'Followed on TikTok', null, 22);

  // Yuki
  log(yuki.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 35);
  log(yuki.id, 15, 'purchase', 'Purchase — Order #B-1068', 'B-1068', 30);
  log(yuki.id, 15, 'review_photo', 'Photo review submitted', null, 25);
  log(yuki.id, 15, 'purchase', 'Purchase — Order #B-1096', 'B-1096', 9);

  // Felix
  log(felix.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 60);
  log(felix.id, 15, 'purchase', 'Purchase — Order #B-1033', 'B-1033', 58);
  log(felix.id, 75, 'first_order', 'First order bonus!', 'B-1033', 58);

  // Chloe
  log(chloe.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 68);
  log(chloe.id, 15, 'purchase', 'Purchase — Order #B-1036', 'B-1036', 55);
  log(chloe.id, 75, 'first_order', 'First order bonus!', 'B-1036', 55);
  log(chloe.id, 10, 'follow_tiktok', 'Followed on TikTok', null, 53);
  log(chloe.id, -50, 'redeem', 'Redeemed €3 off', null, 48);
  log(chloe.id, 8, 'referral_l2', 'Referral: Ines Moreau ordered', 'B-1062', 38);
  log(chloe.id, 15, 'purchase', 'Purchase — Order #B-1079', 'B-1079', 16);
  log(chloe.id, 15, 'purchase', 'Purchase — Order #B-1097', 'B-1097', 6);
  log(chloe.id, 15, 'purchase', 'Purchase — Order #B-1109', 'B-1109', 1, 8);

  // Tariq
  log(tariq.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 18);

  // Ines
  log(ines.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 42);
  log(ines.id, 15, 'purchase', 'Purchase — Order #B-1062', 'B-1062', 38);
  log(ines.id, 75, 'first_order', 'First order bonus!', 'B-1062', 38);
  log(ines.id, -20, 'clawback', 'Clawback: partial refund Order #B-1062', 'B-1062R', 32);
  log(ines.id, 15, 'purchase', 'Purchase — Order #B-1101', 'B-1101', 6);

  // James — loyal, 8 orders
  log(james.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 100);
  log(james.id, 15, 'purchase', 'Purchase — Order #B-1003', 'B-1003', 98);
  log(james.id, 75, 'first_order', 'First order bonus!', 'B-1003', 98);
  log(james.id, 10, 'follow_tiktok', 'Followed on TikTok', null, 96);
  log(james.id, 10, 'follow_instagram', 'Followed on Instagram', null, 95);
  log(james.id, 15, 'purchase', 'Purchase — Order #B-1014', 'B-1014', 85);
  log(james.id, -100, 'redeem', 'Redeemed €6 off', null, 78);
  log(james.id, 15, 'purchase', 'Purchase — Order #B-1029', 'B-1029', 65);
  log(james.id, -50, 'redeem', 'Redeemed €3 off', null, 58);
  log(james.id, 15, 'purchase', 'Purchase — Order #B-1044', 'B-1044', 48);
  log(james.id, 30, 'birthday', 'Birthday bonus!', null, 38);
  log(james.id, 15, 'purchase', 'Purchase — Order #B-1059', 'B-1059', 35);
  log(james.id, 15, 'review_photo', 'Photo review submitted', null, 30);
  log(james.id, 15, 'purchase', 'Purchase — Order #B-1073', 'B-1073', 22);
  log(james.id, 15, 'purchase', 'Purchase — Order #B-1089', 'B-1089', 8);
  log(james.id, 15, 'purchase', 'Purchase — Order #B-1104', 'B-1104', 0, 4);

  // Leila
  log(leila.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 48);
  log(leila.id, 15, 'purchase', 'Purchase — Order #B-1049', 'B-1049', 44);
  log(leila.id, 75, 'first_order', 'First order bonus!', 'B-1049', 44);
  log(leila.id, 15, 'purchase', 'Purchase — Order #B-1081', 'B-1081', 11);

  // Chen — 6 orders
  log(chen.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 88);
  log(chen.id, 15, 'purchase', 'Purchase — Order #B-1007', 'B-1007', 86);
  log(chen.id, 75, 'first_order', 'First order bonus!', 'B-1007', 86);
  log(chen.id, 10, 'follow_instagram', 'Followed on Instagram', null, 84);
  log(chen.id, -100, 'redeem', 'Redeemed €6 off', null, 70);
  log(chen.id, 15, 'purchase', 'Purchase — Order #B-1031', 'B-1031', 62);
  log(chen.id, 15, 'purchase', 'Purchase — Order #B-1051', 'B-1051', 42);
  log(chen.id, 15, 'purchase', 'Purchase — Order #B-1071', 'B-1071', 25);
  log(chen.id, 15, 'purchase', 'Purchase — Order #B-1096a', 'B-1096a', 8);
  log(chen.id, 15, 'purchase', 'Purchase — Order #B-1116', 'B-1116', 1, 2);

  // Maria
  log(maria.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 3);
  log(maria.id, 5, 'share_product', 'Shared a product', null, 3);

  // Kwame
  log(kwame.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 52);
  log(kwame.id, 15, 'purchase', 'Purchase — Order #B-1054', 'B-1054', 46);
  log(kwame.id, 75, 'first_order', 'First order bonus!', 'B-1054', 46);
  log(kwame.id, -50, 'redeem', 'Redeemed €3 off', null, 38);
  log(kwame.id, -15, 'manual_deduct', 'Admin correction', null, 36);
  log(kwame.id, 15, 'purchase', 'Purchase — Order #B-1081a', 'B-1081a', 14);

  // Elena (churned)
  log(elena.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 115);
  log(elena.id, 15, 'purchase', 'Purchase — Order #B-1006', 'B-1006', 110);
  log(elena.id, 75, 'first_order', 'First order bonus!', 'B-1006', 110);
  log(elena.id, -50, 'redeem', 'Redeemed €3 off', null, 100);
  log(elena.id, -65, 'clawback', 'Clawback: full refund Order #B-1006', 'B-1006R', 92);

  // Sam (at risk)
  log(sam.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 85);
  log(sam.id, 15, 'purchase', 'Purchase — Order #B-1017', 'B-1017', 46);

  // Noor
  log(noor.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 1);

  // Freya
  log(freya.id, 25, 'signup', 'Welcome to Brew & Bean!', null, 2);
  log(freya.id, 10, 'follow_tiktok', 'Followed on TikTok', null, 2);

  // Batch insert all logs
  for (const l of logs) {
    await prisma.pointsLog.create({
      data: { projectId: pid, customerId: l.cid, points: l.points, type: l.type, description: l.desc, orderId: l.orderId, createdAt: l.at },
    });
  }

  // ── Redemptions ──
  console.log('  Redemptions...');
  await prisma.redemption.createMany({
    data: [
      { projectId: pid, customerId: olivia.id, pointsSpent: 400, discountAmount: 25, discountCode: 'BREW-OLV8M3-001', used: true, createdAt: dt(65) },
      { projectId: pid, customerId: olivia.id, pointsSpent: 200, discountAmount: 12, discountCode: 'BREW-OLV8M3-002', used: true, createdAt: dt(35) },
      { projectId: pid, customerId: liam.id, pointsSpent: 200, discountAmount: 12, discountCode: 'BREW-LM4N7K-003', used: true, createdAt: dt(60) },
      { projectId: pid, customerId: liam.id, pointsSpent: 100, discountAmount: 6, discountCode: 'BREW-LM4N7K-004', used: true, createdAt: dt(42) },
      { projectId: pid, customerId: liam.id, pointsSpent: 50, discountAmount: 3, discountCode: 'BREW-LM4N7K-005', used: false, createdAt: dt(10) },
      { projectId: pid, customerId: aisha.id, pointsSpent: 100, discountAmount: 6, discountCode: 'BREW-AP2R6D-006', used: true, createdAt: dt(52) },
      { projectId: pid, customerId: noah.id, pointsSpent: 100, discountAmount: 6, discountCode: 'BREW-NK9T2B-007', used: true, createdAt: dt(28) },
      { projectId: pid, customerId: diego.id, pointsSpent: 100, discountAmount: 6, discountCode: 'BREW-DS8Q4V-008', used: true, createdAt: dt(35) },
      { projectId: pid, customerId: diego.id, pointsSpent: 50, discountAmount: 3, discountCode: 'BREW-DS8Q4V-009', used: true, createdAt: dt(28) },
      { projectId: pid, customerId: james.id, pointsSpent: 100, discountAmount: 6, discountCode: 'BREW-JO8N4R-010', used: true, createdAt: dt(78) },
      { projectId: pid, customerId: james.id, pointsSpent: 50, discountAmount: 3, discountCode: 'BREW-JO8N4R-011', used: true, createdAt: dt(58) },
      { projectId: pid, customerId: kwame.id, pointsSpent: 50, discountAmount: 3, discountCode: 'BREW-KA1S8V-012', used: true, createdAt: dt(38) },
      { projectId: pid, customerId: chen.id, pointsSpent: 100, discountAmount: 6, discountCode: 'BREW-CW6Q2T-013', used: true, createdAt: dt(70) },
      { projectId: pid, customerId: zara.id, pointsSpent: 50, discountAmount: 3, discountCode: 'BREW-ZA3S7G-014', used: true, createdAt: dt(50) },
      { projectId: pid, customerId: chloe.id, pointsSpent: 50, discountAmount: 3, discountCode: 'BREW-CD7K3N-015', used: true, createdAt: dt(48) },
      { projectId: pid, customerId: elena.id, pointsSpent: 50, discountAmount: 3, discountCode: 'BREW-EV4T1W-016', used: true, createdAt: dt(100) },
    ],
  });

  // ── Processed Orders ──
  const orderIds = logs.filter(l => l.orderId && !l.orderId.endsWith('R')).map(l => l.orderId!);
  const uniqueOrders = [...new Set(orderIds)];
  await prisma.processedOrder.createMany({
    data: uniqueOrders.map(id => ({ projectId: pid, orderId: id })),
  });

  // ── Partner Earnings ──
  console.log('  Partner earnings...');
  const partnerOrders = [
    { partnerId: olivia.id, customerId: noah.id, orderId: 'B-1020', total: 42, pct: 12 },
    { partnerId: olivia.id, customerId: sofia.id, orderId: 'B-1025', total: 38, pct: 12 },
    { partnerId: olivia.id, customerId: ethan.id, orderId: 'B-1035', total: 55, pct: 12 },
    { partnerId: olivia.id, customerId: diego.id, orderId: 'B-1040', total: 65, pct: 12 },
    { partnerId: olivia.id, customerId: noah.id, orderId: 'B-1098', total: 48, pct: 12 },
    { partnerId: olivia.id, customerId: diego.id, orderId: 'B-1114', total: 52, pct: 12 },
    { partnerId: liam.id, customerId: zara.id, orderId: 'B-1024', total: 45, pct: 10 },
    { partnerId: liam.id, customerId: oscar.id, orderId: 'B-1042', total: 32, pct: 10 },
    { partnerId: liam.id, customerId: isla.id, orderId: 'B-1050', total: 58, pct: 10 },
    { partnerId: liam.id, customerId: zara.id, orderId: 'B-1100', total: 35, pct: 10 },
  ];
  await prisma.partnerEarning.createMany({
    data: partnerOrders.map(pe => ({
      projectId: pid,
      partnerId: pe.partnerId,
      customerId: pe.customerId,
      orderId: pe.orderId,
      orderTotal: pe.total,
      commissionPct: pe.pct,
      amountEarned: parseFloat(((pe.total * pe.pct) / 100).toFixed(2)),
      rewardType: 'credit',
    })),
  });

  // ── Settings ──
  console.log('  Settings...');
  const settings: Record<string, string> = {
    min_order_referral: '8', max_direct_referrals: '50', points_expiry_months: '12',
    referral_discount_percent: '5', partner_reward_type: 'credit',
    gamification_enabled: 'true', leaderboard_enabled: 'true',
    tier_bronze_label: 'Bean', tier_bronze_threshold: '100', tier_bronze_multiplier: '1.0',
    tier_silver_label: 'Roast', tier_silver_threshold: '500', tier_silver_multiplier: '1.25',
    tier_gold_label: 'Barista', tier_gold_threshold: '1000', tier_gold_multiplier: '1.5',
    widget_primary_color: '#d97706', widget_bg_color: '#fef3c7', widget_text_color: '#1c1917',
    widget_brand_name: 'Brew & Bean', social_tiktok_url: 'https://tiktok.com/@brewbean',
    social_instagram_url: 'https://instagram.com/brewbean', referral_base_url: 'https://brewbean.com',
    email_notification_mode: 'instant', email_welcome_enabled: 'true',
    email_referral_enabled: 'true', email_from_name: 'Brew & Bean Rewards',
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { projectId_key: { projectId: pid, key } }, update: { value }, create: { projectId: pid, key, value } });
  }

  return { org, owner, project, pubKey, secKey, customerCount: c.length, logCount: logs.length, orderCount: uniqueOrders.length };
}

async function seedVelvet() {
  console.log('\n── Seeding Velvet Fashion ──');

  const org = await prisma.organization.create({
    data: { name: 'Velvet Fashion', slug: 'velvet-fashion' },
  });

  const passwordHash = await bcrypt.hash('admin', 10);
  const owner = await prisma.user.create({
    data: { email: 'hello@velvetfashion.com', passwordHash, name: 'Priya Sharma' },
  });
  await prisma.orgMembership.create({ data: { userId: owner.id, orgId: org.id, role: 'owner' } });

  // API keys (declared early so hmacSecret can reference secKey)
  const pubKey = 'pk_live_velvet_test_pub_key_002';
  const secKey = 'sk_live_velvet_test_sec_key_002';

  const project = await prisma.project.create({
    data: {
      orgId: org.id, name: 'Velvet VIP', domain: 'velvetfashion.com', platform: 'shopify',
      pointsEnabled: true, referralsEnabled: true, partnersEnabled: false,
      hmacSecret: secKey,
    },
  });
  const pid = project.id;
  await prisma.apiKey.createMany({
    data: [
      { projectId: pid, type: 'public', keyHash: hashKey(pubKey), keyPrefix: pubKey.substring(0, 12), label: 'Default' },
      { projectId: pid, type: 'secret', keyHash: hashKey(secKey), keyPrefix: secKey.substring(0, 12), label: 'Default' },
    ],
  });

  // Earn actions
  await prisma.earnAction.createMany({
    data: [
      { projectId: pid, slug: 'signup', label: 'Sign up', points: 20, category: 'predefined', frequency: 'one_time', sortOrder: 0 },
      { projectId: pid, slug: 'purchase', label: 'Every purchase', points: 10, category: 'predefined', frequency: 'repeatable', sortOrder: 1 },
      { projectId: pid, slug: 'first_order', label: 'First order bonus', points: 50, category: 'predefined', frequency: 'one_time', sortOrder: 2 },
      { projectId: pid, slug: 'review_photo', label: 'Photo review', points: 12, category: 'predefined', frequency: 'repeatable', sortOrder: 3 },
      { projectId: pid, slug: 'review_text', label: 'Text review', points: 5, category: 'predefined', frequency: 'repeatable', sortOrder: 4 },
      { projectId: pid, slug: 'share_product', label: 'Share a product', points: 5, category: 'predefined', frequency: 'repeatable', sortOrder: 5 },
      { projectId: pid, slug: 'birthday', label: 'Birthday bonus', points: 25, category: 'predefined', frequency: 'yearly', sortOrder: 6 },
      { projectId: pid, slug: 'follow_tiktok', label: 'Follow on TikTok', points: 10, category: 'social_follow', frequency: 'one_time', sortOrder: 7 },
      { projectId: pid, slug: 'follow_instagram', label: 'Follow on Instagram', points: 10, category: 'social_follow', frequency: 'one_time', sortOrder: 8 },
    ],
  });

  // Redemption tiers
  await prisma.redemptionTier.createMany({
    data: [
      { projectId: pid, points: 50, discount: 2, sortOrder: 0 },
      { projectId: pid, points: 100, discount: 5, sortOrder: 1 },
      { projectId: pid, points: 200, discount: 10, sortOrder: 2 },
      { projectId: pid, points: 400, discount: 20, sortOrder: 3 },
    ],
  });

  // Referral levels
  await prisma.referralLevel.createMany({
    data: [
      { projectId: pid, level: 1, points: 10 },
      { projectId: pid, level: 2, points: 5 },
      { projectId: pid, level: 3, points: 2 },
    ],
  });

  // 10 Customers
  console.log('  Customers...');
  const vc = await Promise.all([
    prisma.customer.create({ data: { projectId: pid, email: 'ava@velvet.com', name: 'Ava Bennett', referralCode: 'AVB3K7', pointsBalance: 280, pointsEarnedTotal: 430, orderCount: 8, signupRewarded: true, firstOrderRewarded: true, followedTiktok: true, followedInstagram: true, emailVerified: true, createdAt: dt(90), lastActivity: dt(0, 5) } }),
    prisma.customer.create({ data: { projectId: pid, email: 'leo@velvet.com', name: 'Leo Strand', referralCode: 'LS6P2M', pointsBalance: 150, pointsEarnedTotal: 200, orderCount: 4, signupRewarded: true, firstOrderRewarded: true, emailVerified: true, createdAt: dt(78), lastActivity: dt(3) } }),
    prisma.customer.create({ data: { projectId: pid, email: 'ruby@velvet.com', name: 'Ruby Chen', referralCode: 'RC9T5N', referredBy: 'AVB3K7', pointsBalance: 110, pointsEarnedTotal: 160, orderCount: 3, signupRewarded: true, firstOrderRewarded: true, emailVerified: true, createdAt: dt(65), lastActivity: dt(5) } }),
    prisma.customer.create({ data: { projectId: pid, email: 'max@velvet.com', name: 'Max Hoffman', referralCode: 'MH2W8Q', referredBy: 'AVB3K7', pointsBalance: 75, pointsEarnedTotal: 100, orderCount: 2, signupRewarded: true, firstOrderRewarded: true, emailVerified: true, createdAt: dt(55), lastActivity: dt(10) } }),
    prisma.customer.create({ data: { projectId: pid, email: 'zoe@velvet.com', name: 'Zoe Laurent', referralCode: 'ZL4X1R', referredBy: 'AVB3K7', pointsBalance: 40, pointsEarnedTotal: 40, orderCount: 0, signupRewarded: true, emailVerified: true, createdAt: dt(20), lastActivity: dt(20) } }),
    prisma.customer.create({ data: { projectId: pid, email: 'finn@velvet.com', name: 'Finn Callahan', referralCode: 'FC7Y3S', referredBy: 'LS6P2M', pointsBalance: 85, pointsEarnedTotal: 110, orderCount: 2, signupRewarded: true, firstOrderRewarded: true, emailVerified: true, createdAt: dt(50), lastActivity: dt(7) } }),
    prisma.customer.create({ data: { projectId: pid, email: 'nina@velvet.com', name: 'Nina Park', referralCode: 'NP1Z6T', referredBy: 'LS6P2M', pointsBalance: 30, pointsEarnedTotal: 30, orderCount: 0, signupRewarded: true, emailVerified: true, createdAt: dt(28), lastActivity: dt(28) } }),
    prisma.customer.create({ data: { projectId: pid, email: 'omar@velvet.com', name: 'Omar Farah', referralCode: 'OF3A9U', referredBy: 'RC9T5N', pointsBalance: 55, pointsEarnedTotal: 80, orderCount: 1, signupRewarded: true, emailVerified: true, createdAt: dt(38), lastActivity: dt(12) } }),
    prisma.customer.create({ data: { projectId: pid, email: 'ella@velvet.com', name: 'Ella Morrison', referralCode: 'EM6B2V', pointsBalance: 20, pointsEarnedTotal: 20, orderCount: 0, signupRewarded: true, emailVerified: true, createdAt: dt(5), lastActivity: dt(5) } }),
    prisma.customer.create({ data: { projectId: pid, email: 'jay@velvet.com', name: 'Jay Pham', referralCode: 'JP8C4W', pointsBalance: 95, pointsEarnedTotal: 145, orderCount: 3, signupRewarded: true, firstOrderRewarded: true, emailVerified: true, createdAt: dt(70), lastActivity: dt(2) } }),
  ]);
  const [ava, leo, ruby, max, zoev, finn, ninav, omar, ella, jay] = vc;

  // Referral tree
  await prisma.referralTree.createMany({
    data: [
      { projectId: pid, customerId: ruby.id, parentId: ava.id },
      { projectId: pid, customerId: max.id, parentId: ava.id },
      { projectId: pid, customerId: zoev.id, parentId: ava.id },
      { projectId: pid, customerId: finn.id, parentId: leo.id },
      { projectId: pid, customerId: ninav.id, parentId: leo.id },
      { projectId: pid, customerId: omar.id, parentId: ruby.id },
    ],
  });

  // Points logs
  const vlogs: { cid: number; points: number; type: string; desc: string; orderId: string | null; at: Date }[] = [];
  const vlog = (cid: number, points: number, type: string, desc: string, orderId: string | null, daysAgo: number, hoursAgo = 0) => {
    vlogs.push({ cid, points, type, desc, orderId, at: dt(daysAgo, hoursAgo) });
  };

  // Ava
  vlog(ava.id, 20, 'signup', 'Welcome to Velvet VIP!', null, 90);
  vlog(ava.id, 10, 'purchase', 'Purchase — Order #V-2001', 'V-2001', 88);
  vlog(ava.id, 50, 'first_order', 'First order bonus!', 'V-2001', 88);
  vlog(ava.id, 10, 'follow_tiktok', 'Followed on TikTok', null, 85);
  vlog(ava.id, 10, 'follow_instagram', 'Followed on Instagram', null, 84);
  vlog(ava.id, 10, 'purchase', 'Purchase — Order #V-2010', 'V-2010', 75);
  vlog(ava.id, 5, 'referral_l2', 'Referral: Ruby Chen ordered', 'V-2018', 62);
  vlog(ava.id, 10, 'purchase', 'Purchase — Order #V-2020', 'V-2020', 58);
  vlog(ava.id, 5, 'referral_l2', 'Referral: Max Hoffman ordered', 'V-2028', 50);
  vlog(ava.id, -100, 'redeem', 'Redeemed €5 off', null, 45);
  vlog(ava.id, 10, 'purchase', 'Purchase — Order #V-2032', 'V-2032', 40);
  vlog(ava.id, 2, 'referral_l3', 'Network: Omar Farah ordered', 'V-2040', 35);
  vlog(ava.id, 10, 'purchase', 'Purchase — Order #V-2042', 'V-2042', 28);
  vlog(ava.id, 12, 'review_photo', 'Photo review submitted', null, 22);
  vlog(ava.id, -50, 'redeem', 'Redeemed €2 off', null, 18);
  vlog(ava.id, 10, 'purchase', 'Purchase — Order #V-2050', 'V-2050', 12);
  vlog(ava.id, 10, 'purchase', 'Purchase — Order #V-2058', 'V-2058', 5);
  vlog(ava.id, 10, 'purchase', 'Purchase — Order #V-2065', 'V-2065', 0, 5);

  // Leo
  vlog(leo.id, 20, 'signup', 'Welcome to Velvet VIP!', null, 78);
  vlog(leo.id, 10, 'purchase', 'Purchase — Order #V-2005', 'V-2005', 76);
  vlog(leo.id, 50, 'first_order', 'First order bonus!', 'V-2005', 76);
  vlog(leo.id, 5, 'referral_l2', 'Referral: Finn Callahan ordered', 'V-2030', 48);
  vlog(leo.id, 10, 'purchase', 'Purchase — Order #V-2035', 'V-2035', 38);
  vlog(leo.id, -50, 'redeem', 'Redeemed €2 off', null, 30);
  vlog(leo.id, 10, 'purchase', 'Purchase — Order #V-2048', 'V-2048', 15);
  vlog(leo.id, 10, 'purchase', 'Purchase — Order #V-2060', 'V-2060', 3);

  // Ruby
  vlog(ruby.id, 20, 'signup', 'Welcome to Velvet VIP!', null, 65);
  vlog(ruby.id, 10, 'purchase', 'Purchase — Order #V-2018', 'V-2018', 62);
  vlog(ruby.id, 50, 'first_order', 'First order bonus!', 'V-2018', 62);
  vlog(ruby.id, 5, 'referral_l2', 'Referral: Omar Farah ordered', 'V-2040', 35);
  vlog(ruby.id, 10, 'purchase', 'Purchase — Order #V-2044', 'V-2044', 22);
  vlog(ruby.id, 10, 'purchase', 'Purchase — Order #V-2055', 'V-2055', 5);

  // Max
  vlog(max.id, 20, 'signup', 'Welcome to Velvet VIP!', null, 55);
  vlog(max.id, 10, 'purchase', 'Purchase — Order #V-2028', 'V-2028', 50);
  vlog(max.id, 50, 'first_order', 'First order bonus!', 'V-2028', 50);
  vlog(max.id, 10, 'purchase', 'Purchase — Order #V-2052', 'V-2052', 10);

  // Zoe
  vlog(zoev.id, 20, 'signup', 'Welcome to Velvet VIP!', null, 20);
  vlog(zoev.id, 10, 'follow_tiktok', 'Followed on TikTok', null, 19);
  vlog(zoev.id, 10, 'follow_instagram', 'Followed on Instagram', null, 19);

  // Finn
  vlog(finn.id, 20, 'signup', 'Welcome to Velvet VIP!', null, 50);
  vlog(finn.id, 10, 'purchase', 'Purchase — Order #V-2030', 'V-2030', 48);
  vlog(finn.id, 50, 'first_order', 'First order bonus!', 'V-2030', 48);
  vlog(finn.id, 10, 'purchase', 'Purchase — Order #V-2056', 'V-2056', 7);

  // Nina
  vlog(ninav.id, 20, 'signup', 'Welcome to Velvet VIP!', null, 28);
  vlog(ninav.id, 10, 'follow_instagram', 'Followed on Instagram', null, 27);

  // Omar
  vlog(omar.id, 20, 'signup', 'Welcome to Velvet VIP!', null, 38);
  vlog(omar.id, 10, 'purchase', 'Purchase — Order #V-2040', 'V-2040', 35);
  vlog(omar.id, 50, 'first_order', 'First order bonus!', 'V-2040', 35);

  // Ella
  vlog(ella.id, 20, 'signup', 'Welcome to Velvet VIP!', null, 5);

  // Jay
  vlog(jay.id, 20, 'signup', 'Welcome to Velvet VIP!', null, 70);
  vlog(jay.id, 10, 'purchase', 'Purchase — Order #V-2008', 'V-2008', 68);
  vlog(jay.id, 50, 'first_order', 'First order bonus!', 'V-2008', 68);
  vlog(jay.id, 10, 'purchase', 'Purchase — Order #V-2038', 'V-2038', 32);
  vlog(jay.id, 5, 'share_product', 'Shared a product', null, 25);
  vlog(jay.id, -50, 'redeem', 'Redeemed €2 off', null, 20);
  vlog(jay.id, 10, 'purchase', 'Purchase — Order #V-2062', 'V-2062', 2);

  for (const l of vlogs) {
    await prisma.pointsLog.create({
      data: { projectId: pid, customerId: l.cid, points: l.points, type: l.type, description: l.desc, orderId: l.orderId, createdAt: l.at },
    });
  }

  // Redemptions
  await prisma.redemption.createMany({
    data: [
      { projectId: pid, customerId: ava.id, pointsSpent: 100, discountAmount: 5, discountCode: 'VLV-AVB3K7-001', used: true, createdAt: dt(45) },
      { projectId: pid, customerId: ava.id, pointsSpent: 50, discountAmount: 2, discountCode: 'VLV-AVB3K7-002', used: true, createdAt: dt(18) },
      { projectId: pid, customerId: leo.id, pointsSpent: 50, discountAmount: 2, discountCode: 'VLV-LS6P2M-003', used: true, createdAt: dt(30) },
      { projectId: pid, customerId: jay.id, pointsSpent: 50, discountAmount: 2, discountCode: 'VLV-JP8C4W-004', used: true, createdAt: dt(20) },
    ],
  });

  // Processed orders
  const vOrderIds = vlogs.filter(l => l.orderId).map(l => l.orderId!);
  const vUniqueOrders = [...new Set(vOrderIds)];
  await prisma.processedOrder.createMany({
    data: vUniqueOrders.map(id => ({ projectId: pid, orderId: id })),
  });

  // Settings
  const vSettings: Record<string, string> = {
    min_order_referral: '15', max_direct_referrals: '30', points_expiry_months: '6',
    referral_discount_percent: '10',
    gamification_enabled: 'true', leaderboard_enabled: 'false',
    tier_bronze_label: 'Silver', tier_bronze_threshold: '200', tier_bronze_multiplier: '1.0',
    tier_silver_label: 'Gold', tier_silver_threshold: '500', tier_silver_multiplier: '1.5',
    tier_gold_label: 'Platinum', tier_gold_threshold: '1000', tier_gold_multiplier: '2.0',
    widget_primary_color: '#7c3aed', widget_bg_color: '#f5f3ff', widget_text_color: '#1e1b4b',
    widget_brand_name: 'Velvet VIP', social_tiktok_url: 'https://tiktok.com/@velvetfashion',
    social_instagram_url: 'https://instagram.com/velvetfashion', referral_base_url: 'https://velvetfashion.com',
    email_notification_mode: 'digest', email_welcome_enabled: 'true',
    email_referral_enabled: 'true', email_from_name: 'Velvet Fashion',
  };
  for (const [key, value] of Object.entries(vSettings)) {
    await prisma.setting.upsert({ where: { projectId_key: { projectId: pid, key } }, update: { value }, create: { projectId: pid, key, value } });
  }

  return { org, owner, project, pubKey, secKey, customerCount: vc.length, logCount: vlogs.length, orderCount: vUniqueOrders.length };
}

async function main() {
  await clearAll();

  const brew = await seedBrewBean();
  const velvet = await seedVelvet();

  console.log('\n\n✅ Seed complete!\n');
  console.log('═══════════════════════════════════════════════════');
  console.log(' ORG 1: Brew & Bean Co');
  console.log(`   Admin: admin@brewbean.com / admin (owner)`);
  console.log(`   Member: barista@brewbean.com / member (editor)`);
  console.log(`   Project: ${brew.project.name} (ID: ${brew.project.id})`);
  console.log(`   Public key: ${brew.pubKey}`);
  console.log(`   Secret key: ${brew.secKey}`);
  console.log(`   ${brew.customerCount} customers, ${brew.logCount} points logs, ${brew.orderCount} orders`);
  console.log('───────────────────────────────────────────────────');
  console.log(' ORG 2: Velvet Fashion');
  console.log(`   Admin: hello@velvetfashion.com / admin (owner)`);
  console.log(`   Project: ${velvet.project.name} (ID: ${velvet.project.id})`);
  console.log(`   Public key: ${velvet.pubKey}`);
  console.log(`   Secret key: ${velvet.secKey}`);
  console.log(`   ${velvet.customerCount} customers, ${velvet.logCount} points logs, ${velvet.orderCount} orders`);
  console.log('═══════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
