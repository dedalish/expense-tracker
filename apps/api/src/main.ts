import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: config.get('WEB_ORIGIN', { infer: true }) });
  app.enableShutdownHooks();

  // Swagger UI на /api/docs, JSON на /api/docs-json; в production выключен.
  // Роуты Swagger регистрируются мимо Nest, глобальный AuthGuard их не закрывает.
  if (config.get('NODE_ENV', { infer: true }) !== 'production') {
    const documentConfig = new DocumentBuilder()
      .setTitle('Expense Tracker API')
      .setDescription('REST API трекера расходов')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, () =>
      SwaggerModule.createDocument(app, documentConfig),
    );
  }

  await app.listen(config.get('PORT', { infer: true }));
}

await bootstrap();
