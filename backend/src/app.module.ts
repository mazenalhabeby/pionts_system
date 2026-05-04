import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AppConfigModule } from './config/app-config.module';
import { UtilsModule } from './utils/utils.module';
import { CustomersModule } from './customers/customers.module';
import { ReferralsModule } from './referrals/referrals.module';
import { RedemptionsModule } from './redemptions/redemptions.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { CustomerAuthModule } from './customer-auth/customer-auth.module';
import { AuthModule } from './auth/auth.module';
import { OrgsModule } from './orgs/orgs.module';
import { ProjectsModule } from './projects/projects.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SdkModule } from './sdk/sdk.module';
import { DiscountModule } from './discount/discount.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { BillingModule } from './billing/billing.module';
import { HealthModule } from './health/health.module';
import { EarnActionsModule } from './earn-actions/earn-actions.module';
import { PartnersModule } from './partners/partners.module';
import { InvitationsModule } from './invitations/invitations.module';
import { PlatformAdminModule } from './platform-admin/platform-admin.module';
import { ShopifyAppModule } from './shopify-app/shopify-app.module';
import { BullModule } from '@nestjs/bull';
import { CacheConfigModule } from './cache/cache.module';
import { PlatformModule } from './platforms/platform.module';
import { ApiV2Module } from './api-v2/api-v2.module';
import { WebhooksV2Module } from './webhooks-v2/webhooks-v2.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '..', '..', '.env'),
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 60 }],
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', '..', '..', 'admin-ui', 'dist', 'assets'),
        serveRoot: '/admin/assets',
        serveStaticOptions: {
          maxAge: '1y',
          immutable: true,
        },
      },
      {
        rootPath: join(__dirname, '..', '..', 'public', 'docs'),
        serveRoot: '/docs',
        serveStaticOptions: {
          maxAge: '1h',
        },
      },
      {
        rootPath: join(__dirname, '..', '..', '..', 'sdk', 'dist'),
        serveRoot: '/sdk',
        serveStaticOptions: {
          maxAge: '1d',
        },
      },
      {
        rootPath: join(__dirname, '..', '..', '..', 'client-ui', 'dist-umd'),
        serveRoot: '/widget',
        serveStaticOptions: {
          maxAge: '1d',
        },
      },
    ),
    CacheConfigModule,
    PrismaModule,
    AppConfigModule,
    UtilsModule,
    CustomersModule,
    ReferralsModule,
    RedemptionsModule,
    WebhooksModule,
    CustomerAuthModule,
    AuthModule,
    OrgsModule,
    ProjectsModule,
    DashboardModule,
    SdkModule,
    DiscountModule,
    AnalyticsModule,
    BillingModule,
    HealthModule,
    EarnActionsModule,
    PartnersModule,
    InvitationsModule,
    PlatformAdminModule,
    ShopifyAppModule,
    PlatformModule,
    ApiV2Module,
    WebhooksV2Module,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
