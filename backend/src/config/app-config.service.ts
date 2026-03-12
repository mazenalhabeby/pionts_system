import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULTS } from './config.constants';

@Injectable()
export class AppConfigService {
  /** Per-project config cache: projectId → Map<key, value> */
  private cache = new Map<number, Map<string, string>>();
  private cacheTimestamps = new Map<number, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly prisma: PrismaService) {}

  private isCacheValid(projectId: number): boolean {
    const ts = this.cacheTimestamps.get(projectId);
    return !!ts && Date.now() - ts < this.CACHE_TTL;
  }

  async loadSettingsForProject(projectId: number) {
    const rows = await this.prisma.setting.findMany({ where: { projectId } });
    const projectConfig = new Map<string, string>();
    const existing = new Set<string>();

    for (const row of rows) {
      existing.add(row.key);
      projectConfig.set(row.key, row.value ?? '0');
    }

    // Create missing defaults in DB
    for (const [key, val] of Object.entries(DEFAULTS)) {
      if (!existing.has(key)) {
        await this.prisma.setting.create({ data: { projectId, key, value: val } });
        projectConfig.set(key, val);
      }
    }

    this.cache.set(projectId, projectConfig);
    this.cacheTimestamps.set(projectId, Date.now());
  }

  private async ensureLoaded(projectId: number): Promise<Map<string, string>> {
    if (!this.cache.has(projectId) || !this.isCacheValid(projectId)) {
      await this.loadSettingsForProject(projectId);
    }
    return this.cache.get(projectId)!;
  }

  get(projectId: number, key: string): string {
    const projectConfig = this.cache.get(projectId);
    return projectConfig?.get(key) ?? DEFAULTS[key] ?? '0';
  }

  getInt(projectId: number, key: string): number {
    return parseInt(this.get(projectId, key), 10);
  }

  async getAll(projectId: number): Promise<Record<string, string>> {
    const projectConfig = await this.ensureLoaded(projectId);
    return Object.fromEntries(projectConfig);
  }

  async saveAll(projectId: number, values: Record<string, string>) {
    await this.ensureLoaded(projectId);
    const projectConfig = this.cache.get(projectId)!;

    for (const key of Object.keys(DEFAULTS)) {
      if (values[key] !== undefined) {
        const val = String(values[key]);
        await this.prisma.setting.upsert({
          where: { projectId_key: { projectId, key } },
          update: { value: val },
          create: { projectId, key, value: val },
        });
        projectConfig.set(key, val);
      }
    }
    this.cacheTimestamps.set(projectId, Date.now());
  }

  async getRedemptionTiers(projectId: number) {
    const tiers = await this.prisma.redemptionTier.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
    });
    return tiers.map((t) => ({
      id: t.id,
      points: t.points,
      discount: Number(t.discount),
      sort_order: t.sortOrder,
    }));
  }

  async getReferralLevels(projectId: number) {
    return this.prisma.referralLevel.findMany({
      where: { projectId },
      orderBy: { level: 'asc' },
    });
  }

  /** Parse the dynamic gamification tiers array from settings. */
  getGamificationTiers(projectId: number): { label: string; threshold: number; multiplier: number }[] {
    const raw = this.get(projectId, 'gamification_tiers');
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* fall through */ }
    return [
      { label: 'Bronze', threshold: 0, multiplier: 1 },
      { label: 'Silver', threshold: 200, multiplier: 1.5 },
      { label: 'Gold', threshold: 500, multiplier: 2 },
    ];
  }

  getDefaults(): Record<string, string> {
    return { ...DEFAULTS };
  }
}
