import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'production'
        ? [{ emit: 'event', level: 'warn' }, { emit: 'event', level: 'error' }]
        : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    if (process.env.NODE_ENV === 'production') {
      (this as any).$on('warn', (e: any) => this.logger.warn(e.message));
      (this as any).$on('error', (e: any) => this.logger.error(e.message));
    }
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
