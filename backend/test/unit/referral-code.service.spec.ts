import { Test, TestingModule } from '@nestjs/testing';
import { ReferralCodeService } from '../../src/utils/referral-code.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createPrismaMock, PrismaMock } from '../mocks/prisma.mock';

describe('ReferralCodeService', () => {
  let service: ReferralCodeService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralCodeService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReferralCodeService>(ReferralCodeService);
  });

  it('should generate a 6-character code', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);

    const code = await service.generate(1);

    expect(code).toHaveLength(6);
  });

  it('should only use valid characters', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);

    const code = await service.generate(1);
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    for (const char of code) {
      expect(validChars).toContain(char);
    }
  });

  it('should retry on collision', async () => {
    // First call returns existing (collision), second returns null (unique)
    prisma.customer.findUnique
      .mockResolvedValueOnce({ id: 1 }) // collision
      .mockResolvedValueOnce(null);     // unique

    const code = await service.generate(1);

    expect(code).toHaveLength(6);
    expect(prisma.customer.findUnique).toHaveBeenCalledTimes(2);
  });

  it('should check uniqueness within the given project', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);

    await service.generate(42);

    expect(prisma.customer.findUnique).toHaveBeenCalledWith({
      where: {
        projectId_referralCode: {
          projectId: 42,
          referralCode: expect.any(String),
        },
      },
    });
  });
});
