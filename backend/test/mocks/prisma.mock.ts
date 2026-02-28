/**
 * Deep mock factory for PrismaService.
 * Creates jest.fn() stubs for all model methods used in the codebase.
 */
export function createPrismaMock() {
  const modelMethods = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  });

  return {
    organization: modelMethods(),
    user: modelMethods(),
    project: modelMethods(),
    apiKey: modelMethods(),
    customer: modelMethods(),
    pointsLog: modelMethods(),
    referralTree: modelMethods(),
    redemption: modelMethods(),
    processedOrder: modelMethods(),
    setting: modelMethods(),
    projectMember: modelMethods(),
    subscription: modelMethods(),
    redemptionTier: modelMethods(),
    referralLevel: modelMethods(),
    $transaction: jest.fn((ops: any[]) => Promise.resolve(ops)),
    $queryRaw: jest.fn().mockResolvedValue([]),
    $executeRawUnsafe: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;
