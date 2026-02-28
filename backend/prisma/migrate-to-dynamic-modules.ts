/**
 * Data migration script: Migrate existing projects to the dynamic module architecture.
 *
 * For each existing project:
 * 1. Seed EarnAction rows from current setting values
 * 2. Seed RedemptionTier rows from tier1-4 settings
 * 3. Seed ReferralLevel rows from referral_l2/l3 settings
 * 4. Seed CustomerActionLog from boolean flags (signupRewarded, followedTiktok, etc.)
 *
 * Run with: npx ts-node prisma/migrate-to-dynamic-modules.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateProject(projectId: number) {
  console.log(`\nMigrating project ${projectId}...`);

  // Load current settings
  const settingsRows = await prisma.setting.findMany({ where: { projectId } });
  const settings = new Map<string, string>();
  for (const row of settingsRows) {
    settings.set(row.key, row.value ?? '0');
  }
  const getInt = (key: string, def: number) => parseInt(settings.get(key) ?? String(def), 10);

  // 1. Seed EarnAction rows (skip if already seeded)
  const existingActions = await prisma.earnAction.count({ where: { projectId } });
  if (existingActions === 0) {
    console.log('  Seeding earn actions...');
    await prisma.earnAction.createMany({
      data: [
        { projectId, slug: 'signup', label: 'Sign up', points: getInt('signup_points', 20), category: 'predefined', frequency: 'one_time', sortOrder: 0 },
        { projectId, slug: 'purchase', label: 'Every purchase', points: getInt('purchase_points', 10), category: 'predefined', frequency: 'repeatable', sortOrder: 1 },
        { projectId, slug: 'first_order', label: 'First order bonus', points: getInt('first_order_points', 50), category: 'predefined', frequency: 'one_time', sortOrder: 2 },
        { projectId, slug: 'review_photo', label: 'Photo review', points: getInt('review_photo_points', 12), category: 'predefined', frequency: 'repeatable', sortOrder: 3 },
        { projectId, slug: 'review_text', label: 'Text review', points: getInt('review_text_points', 5), category: 'predefined', frequency: 'repeatable', sortOrder: 4 },
        { projectId, slug: 'share_product', label: 'Share a product', points: getInt('share_product_points', 5), category: 'predefined', frequency: 'repeatable', sortOrder: 5 },
        { projectId, slug: 'birthday', label: 'Birthday bonus', points: getInt('birthday_points', 25), category: 'predefined', frequency: 'yearly', sortOrder: 6 },
        { projectId, slug: 'follow_tiktok', label: 'Follow on TikTok', points: getInt('follow_tiktok_points', 10), category: 'social_follow', frequency: 'one_time', sortOrder: 7, socialUrl: settings.get('social_tiktok_url') || undefined },
        { projectId, slug: 'follow_instagram', label: 'Follow on Instagram', points: getInt('follow_instagram_points', 10), category: 'social_follow', frequency: 'one_time', sortOrder: 8, socialUrl: settings.get('social_instagram_url') || undefined },
      ],
      skipDuplicates: true,
    });
  } else {
    console.log(`  Earn actions already exist (${existingActions}), skipping.`);
  }

  // 2. Seed RedemptionTier rows
  const existingTiers = await prisma.redemptionTier.count({ where: { projectId } });
  if (existingTiers === 0) {
    console.log('  Seeding redemption tiers...');
    const tiers = [
      { points: getInt('tier1_points', 50), discount: getInt('tier1_discount', 2), sortOrder: 0 },
      { points: getInt('tier2_points', 100), discount: getInt('tier2_discount', 5), sortOrder: 1 },
      { points: getInt('tier3_points', 200), discount: getInt('tier3_discount', 10), sortOrder: 2 },
      { points: getInt('tier4_points', 400), discount: getInt('tier4_discount', 20), sortOrder: 3 },
    ];
    await prisma.redemptionTier.createMany({
      data: tiers.map((t) => ({ projectId, ...t })),
    });
  } else {
    console.log(`  Redemption tiers already exist (${existingTiers}), skipping.`);
  }

  // 3. Seed ReferralLevel rows
  const existingLevels = await prisma.referralLevel.count({ where: { projectId } });
  if (existingLevels === 0) {
    console.log('  Seeding referral levels...');
    await prisma.referralLevel.createMany({
      data: [
        { projectId, level: 2, points: getInt('referral_l2_points', 5) },
        { projectId, level: 3, points: getInt('referral_l3_points', 2) },
      ],
      skipDuplicates: true,
    });
  } else {
    console.log(`  Referral levels already exist (${existingLevels}), skipping.`);
  }

  // 4. Seed CustomerActionLog from boolean flags
  const existingLogs = await prisma.customerActionLog.count({ where: { projectId } });
  if (existingLogs === 0) {
    console.log('  Migrating customer action flags...');
    const customers = await prisma.customer.findMany({
      where: { projectId },
      select: { id: true, signupRewarded: true, firstOrderRewarded: true, followedTiktok: true, followedInstagram: true, birthdayRewardedYear: true },
    });

    const actionLogs: Array<{ projectId: number; customerId: number; actionSlug: string; year: number }> = [];

    for (const c of customers) {
      if (c.signupRewarded) actionLogs.push({ projectId, customerId: c.id, actionSlug: 'signup', year: 0 });
      if (c.firstOrderRewarded) actionLogs.push({ projectId, customerId: c.id, actionSlug: 'first_order', year: 0 });
      if (c.followedTiktok) actionLogs.push({ projectId, customerId: c.id, actionSlug: 'follow_tiktok', year: 0 });
      if (c.followedInstagram) actionLogs.push({ projectId, customerId: c.id, actionSlug: 'follow_instagram', year: 0 });
      if (c.birthdayRewardedYear > 0) actionLogs.push({ projectId, customerId: c.id, actionSlug: 'birthday', year: c.birthdayRewardedYear });
    }

    if (actionLogs.length > 0) {
      await prisma.customerActionLog.createMany({ data: actionLogs, skipDuplicates: true });
      console.log(`  Created ${actionLogs.length} action log entries.`);
    }
  } else {
    console.log(`  Customer action logs already exist (${existingLogs}), skipping.`);
  }

  console.log(`  Project ${projectId} migration complete.`);
}

async function main() {
  console.log('Starting dynamic modules data migration...');

  const projects = await prisma.project.findMany({ select: { id: true, name: true } });
  console.log(`Found ${projects.length} project(s) to migrate.`);

  for (const project of projects) {
    await migrateProject(project.id);
  }

  console.log('\nMigration complete!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
