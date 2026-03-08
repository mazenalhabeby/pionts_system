import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, LogLevel, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { EmailSenderService } from '../../src/notifications/email-sender.service';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { testPrisma } from './prisma-test.helper';

/** Mock EmailSenderService that always succeeds without SMTP. */
const mockEmailSenderService = {
  send: async () => true,
};

/** ThrottlerGuard override that always passes (for most E2E tests). */
class NoopThrottlerGuard extends ThrottlerGuard {
  override async canActivate(): Promise<boolean> {
    return true;
  }
}

/**
 * Creates a NestJS test app wired to the test database with throttling disabled.
 * Mirrors main.ts bootstrap middleware (session, ValidationPipe, HttpExceptionFilter).
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(testPrisma)
    .overrideProvider(APP_GUARD)
    .useClass(NoopThrottlerGuard)
    .overrideProvider(EmailSenderService)
    .useValue(mockEmailSenderService)
    .compile();

  const app = moduleFixture.createNestApplication({ logger: ['warn'] as LogLevel[] });

  app.use(cookieParser());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'test-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();
  return app;
}

/**
 * Creates a NestJS test app WITH throttling enabled (for rate limit tests).
 */
export async function createTestAppWithThrottling(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(testPrisma)
    .overrideProvider(EmailSenderService)
    .useValue(mockEmailSenderService)
    .compile();

  const app = moduleFixture.createNestApplication({ logger: ['warn'] as LogLevel[] });

  app.use(cookieParser());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'test-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();
  return app;
}
