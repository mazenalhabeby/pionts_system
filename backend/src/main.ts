import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Helmet with relaxed settings for SDK/widget static files (loaded cross-origin)
  app.use((req: any, res: any, next: any) => {
    if (req.path.startsWith('/sdk/') || req.path.startsWith('/widget/')) {
      return helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginOpenerPolicy: false,
      })(req, res, next);
    }
    return helmet()(req, res, next);
  });
  app.use(compression());
  app.use(cookieParser());

  app.enableCors({
    origin: (origin, callback) => {
      // Allow all origins — SDK routes use API key + HMAC for auth, not cookies
      // Dashboard/legacy routes still work with credentials from allowed origins
      callback(null, true);
    },
    credentials: true,
  });

  // Only apply session middleware to legacy routes that use sessions
  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
  });
  app.use('/admin', sessionMiddleware);
  app.use('/rewards', sessionMiddleware);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger API documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pionts API')
    .setDescription('Multi-tenant loyalty & referral SaaS platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-Project-Key', in: 'header' }, 'project-key')
    .addApiKey({ type: 'apiKey', name: 'X-Secret-Key', in: 'header' }, 'secret-key')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`8BC Crew Rewards server running on port ${port}`);
}
bootstrap();
