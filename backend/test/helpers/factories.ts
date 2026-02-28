import { testPrisma } from './prisma-test.helper';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

let orgCounter = 0;
let userCounter = 0;
let customerCounter = 0;

export function resetCounters() {
  orgCounter = 0;
  userCounter = 0;
  customerCounter = 0;
}

export async function createOrg(overrides: Partial<{
  name: string;
  slug: string;
}> = {}) {
  orgCounter++;
  return testPrisma.organization.create({
    data: {
      name: overrides.name ?? `Test Org ${orgCounter}`,
      slug: overrides.slug ?? `test-org-${orgCounter}-${Date.now().toString(36)}`,
    },
  });
}

export async function createUser(orgId: number, overrides: Partial<{
  email: string;
  password: string;
  name: string;
  role: string;
}> = {}) {
  userCounter++;
  const password = overrides.password ?? 'password123';
  const passwordHash = await bcrypt.hash(password, 10);
  return testPrisma.user.create({
    data: {
      orgId,
      email: overrides.email ?? `user${userCounter}@test.com`,
      passwordHash,
      name: overrides.name ?? `Test User ${userCounter}`,
      role: overrides.role ?? 'owner',
    },
  });
}

export async function createProject(orgId: number, overrides: Partial<{
  name: string;
  domain: string;
  status: string;
}> = {}) {
  return testPrisma.project.create({
    data: {
      orgId,
      name: overrides.name ?? 'Test Project',
      domain: overrides.domain ?? null,
      status: overrides.status ?? 'active',
    },
  });
}

export async function createApiKeyPair(projectId: number) {
  const publicRaw = `pk_live_${crypto.randomBytes(24).toString('hex')}`;
  const secretRaw = `sk_live_${crypto.randomBytes(24).toString('hex')}`;

  await testPrisma.apiKey.createMany({
    data: [
      {
        projectId,
        type: 'public',
        keyHash: crypto.createHash('sha256').update(publicRaw).digest('hex'),
        keyPrefix: publicRaw.substring(0, 12),
        label: 'Default',
      },
      {
        projectId,
        type: 'secret',
        keyHash: crypto.createHash('sha256').update(secretRaw).digest('hex'),
        keyPrefix: secretRaw.substring(0, 12),
        label: 'Default',
      },
    ],
  });

  return { publicKey: publicRaw, secretKey: secretRaw };
}

export async function createCustomer(projectId: number, overrides: Partial<{
  email: string;
  name: string;
  referralCode: string;
  referredBy: string;
  pointsBalance: number;
  pointsEarnedTotal: number;
  orderCount: number;
  signupRewarded: boolean;
  firstOrderRewarded: boolean;
  followedTiktok: boolean;
  followedInstagram: boolean;
  birthday: string;
  birthdayRewardedYear: number;
  emailVerified: boolean;
}> = {}) {
  customerCounter++;
  const code = overrides.referralCode ?? generateCode();
  return testPrisma.customer.create({
    data: {
      projectId,
      email: overrides.email ?? `customer${customerCounter}@test.com`,
      name: overrides.name ?? `Customer ${customerCounter}`,
      referralCode: code,
      referredBy: overrides.referredBy ?? null,
      pointsBalance: overrides.pointsBalance ?? 0,
      pointsEarnedTotal: overrides.pointsEarnedTotal ?? 0,
      orderCount: overrides.orderCount ?? 0,
      signupRewarded: overrides.signupRewarded ?? false,
      firstOrderRewarded: overrides.firstOrderRewarded ?? false,
      followedTiktok: overrides.followedTiktok ?? false,
      followedInstagram: overrides.followedInstagram ?? false,
      birthday: overrides.birthday ?? null,
      birthdayRewardedYear: overrides.birthdayRewardedYear ?? 0,
      emailVerified: overrides.emailVerified ?? false,
    },
  });
}

export async function createPointsLog(projectId: number, customerId: number, overrides: Partial<{
  points: number;
  type: string;
  description: string;
  orderId: string;
}> = {}) {
  return testPrisma.pointsLog.create({
    data: {
      projectId,
      customerId,
      points: overrides.points ?? 10,
      type: overrides.type ?? 'purchase',
      description: overrides.description ?? 'Test points',
      orderId: overrides.orderId ?? null,
    },
  });
}

export async function createReferralTree(projectId: number, customerId: number, parentId: number, _grandparentId?: number) {
  return testPrisma.referralTree.create({
    data: {
      projectId,
      customerId,
      parentId,
    },
  });
}

export async function createReferralLevel(projectId: number, level: number, points: number) {
  return testPrisma.referralLevel.upsert({
    where: { projectId_level: { projectId, level } },
    update: { points },
    create: { projectId, level, points },
  });
}

export async function createSetting(projectId: number, key: string, value: string) {
  return testPrisma.setting.upsert({
    where: { projectId_key: { projectId, key } },
    update: { value },
    create: { projectId, key, value },
  });
}

export async function createEarnAction(projectId: number, overrides: Partial<{
  slug: string;
  label: string;
  points: number;
  category: string;
  frequency: string;
  enabled: boolean;
  sortOrder: number;
}>) {
  return testPrisma.earnAction.upsert({
    where: { projectId_slug: { projectId, slug: overrides.slug! } },
    update: { points: overrides.points },
    create: {
      projectId,
      slug: overrides.slug!,
      label: overrides.label ?? overrides.slug!,
      points: overrides.points ?? 0,
      category: overrides.category ?? 'predefined',
      frequency: overrides.frequency ?? 'one_time',
      enabled: overrides.enabled ?? true,
      sortOrder: overrides.sortOrder ?? 0,
    },
  });
}

export async function createRedemptionTier(projectId: number, points: number, discount: number, sortOrder = 0) {
  return testPrisma.redemptionTier.create({
    data: { projectId, points, discount, sortOrder },
  });
}

/** Seeds the standard set of earn actions for a project (matches EarnActionsService.seedDefaultActions) */
export async function seedDefaultEarnActions(projectId: number) {
  const actions = [
    { slug: 'signup', label: 'Sign up', points: 20, category: 'predefined', frequency: 'one_time', sortOrder: 0 },
    { slug: 'purchase', label: 'Every purchase', points: 10, category: 'predefined', frequency: 'repeatable', sortOrder: 1 },
    { slug: 'first_order', label: 'First order bonus', points: 50, category: 'predefined', frequency: 'one_time', sortOrder: 2 },
    { slug: 'review_photo', label: 'Photo review', points: 12, category: 'predefined', frequency: 'repeatable', sortOrder: 3 },
    { slug: 'review_text', label: 'Text review', points: 5, category: 'predefined', frequency: 'repeatable', sortOrder: 4 },
    { slug: 'share_product', label: 'Share a product', points: 5, category: 'predefined', frequency: 'repeatable', sortOrder: 5 },
    { slug: 'birthday', label: 'Birthday bonus', points: 25, category: 'predefined', frequency: 'yearly', sortOrder: 6 },
    { slug: 'follow_tiktok', label: 'Follow on TikTok', points: 10, category: 'social_follow', frequency: 'one_time', sortOrder: 7 },
    { slug: 'follow_instagram', label: 'Follow on Instagram', points: 10, category: 'social_follow', frequency: 'one_time', sortOrder: 8 },
  ];
  await testPrisma.earnAction.createMany({
    data: actions.map((a) => ({ projectId, ...a })),
    skipDuplicates: true,
  });
}

/** Seeds the standard redemption tiers for a project (matches ProjectsService.create) */
export async function seedDefaultRedemptionTiers(projectId: number) {
  await testPrisma.redemptionTier.createMany({
    data: [
      { projectId, points: 50, discount: 2, sortOrder: 0 },
      { projectId, points: 100, discount: 5, sortOrder: 1 },
      { projectId, points: 200, discount: 10, sortOrder: 2 },
      { projectId, points: 400, discount: 20, sortOrder: 3 },
    ],
  });
}

export async function createProcessedOrder(projectId: number, orderId: string) {
  return testPrisma.processedOrder.create({
    data: { projectId, orderId },
  });
}

export async function createRedemption(projectId: number, customerId: number, overrides: Partial<{
  pointsSpent: number;
  discountAmount: number;
  discountCode: string;
  used: boolean;
}> = {}) {
  return testPrisma.redemption.create({
    data: {
      projectId,
      customerId,
      pointsSpent: overrides.pointsSpent ?? 100,
      discountAmount: overrides.discountAmount ?? 5,
      discountCode: overrides.discountCode ?? `PIONTS-TEST-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      used: overrides.used ?? false,
    },
  });
}

export async function createProjectMember(projectId: number, userId: number, role = 'editor') {
  return testPrisma.projectMember.create({
    data: { projectId, userId, role },
  });
}

function generateCode(): string {
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}
