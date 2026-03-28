import { INestApplication } from '@nestjs/common';
import { createTestApp } from './test-app.helper';
import { resetDatabase, disconnectTestPrisma } from './prisma-test.helper';
import { resetCounters } from './factories';

/**
 * Standard E2E test setup: reset DB, create test app, cleanup on finish.
 * Returns a getter for the app instance (available after beforeAll completes).
 *
 * Usage:
 *   const { getApp } = setupE2E();
 *   // In tests: const app = getApp();
 */
export function setupE2E() {
  let app: INestApplication;

  beforeAll(async () => {
    await resetDatabase();
    resetCounters();
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestPrisma();
  });

  return { getApp: () => app };
}
