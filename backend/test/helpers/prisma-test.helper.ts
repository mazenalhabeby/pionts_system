import { PrismaClient } from '@prisma/client';

const TEST_DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/pionts_test';

export const testPrisma = new PrismaClient({
  datasources: { db: { url: TEST_DATABASE_URL } },
});

/**
 * Truncate all tables and restart identity sequences.
 * Called in beforeAll of each E2E spec to ensure a clean slate.
 */
export async function resetDatabase() {
  await testPrisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      points_log,
      referral_tree,
      redemptions,
      processed_orders,
      settings,
      api_keys,
      customers,
      project_members,
      invitations,
      projects,
      org_memberships,
      users,
      organizations
    RESTART IDENTITY CASCADE
  `);
}

export async function disconnectTestPrisma() {
  await testPrisma.$disconnect();
}
