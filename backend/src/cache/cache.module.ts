import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      useFactory: async () => {
        const host = process.env.REDIS_HOST || 'localhost';
        const port = parseInt(process.env.REDIS_PORT || '6379', 10);
        const password = process.env.REDIS_PASSWORD || undefined;

        return {
          store: await redisStore({
            host,
            port,
            password,
            ttl: 30_000, // default 30s TTL
          }),
        };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheConfigModule {}
