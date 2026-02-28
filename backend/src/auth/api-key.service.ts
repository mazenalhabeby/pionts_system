import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  private hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  private generateRawKey(type: 'public' | 'secret'): string {
    const prefix = type === 'public' ? 'pk_live_' : 'sk_live_';
    const random = crypto.randomBytes(24).toString('hex');
    return `${prefix}${random}`;
  }

  async generateKeyPair(projectId: number): Promise<{ publicKey: string; secretKey: string }> {
    const publicRaw = this.generateRawKey('public');
    const secretRaw = this.generateRawKey('secret');

    await this.prisma.apiKey.createMany({
      data: [
        {
          projectId,
          type: 'public',
          keyHash: this.hashKey(publicRaw),
          keyPrefix: publicRaw.substring(0, 12),
          label: 'Default',
        },
        {
          projectId,
          type: 'secret',
          keyHash: this.hashKey(secretRaw),
          keyPrefix: secretRaw.substring(0, 12),
          label: 'Default',
        },
      ],
    });

    return { publicKey: publicRaw, secretKey: secretRaw };
  }

  async validateKey(rawKey: string, type: 'public' | 'secret') {
    const hash = this.hashKey(rawKey);
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { keyHash: hash, type, revoked: false },
      include: { project: true },
    });
    if (!apiKey) return null;
    return apiKey.project;
  }

  async revokeKey(keyId: number) {
    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revoked: true },
    });
  }

  async listKeys(projectId: number) {
    return this.prisma.apiKey.findMany({
      where: { projectId },
      select: {
        id: true,
        type: true,
        keyPrefix: true,
        label: true,
        revoked: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
