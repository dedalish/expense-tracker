import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import type { Env } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Клиент Prisma для всего приложения (провайдер глобального `PrismaModule`).
 * Подключается к PostgreSQL через driver adapter `@prisma/adapter-pg`.
 * Напрямую его используют только репозитории модулей.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  /**
   * @param config Конфигурация с проверенным `DATABASE_URL`. Соединение
   *   открывается лениво, при первом запросе, поэтому недоступная БД
   *   здесь ошибку не даёт.
   */
  constructor(config: ConfigService<Env, true>) {
    super({
      adapter: new PrismaPg({
        connectionString: config.get('DATABASE_URL', { infer: true }),
      }),
    });
  }

  /** Закрывает соединения с БД при остановке приложения. */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
