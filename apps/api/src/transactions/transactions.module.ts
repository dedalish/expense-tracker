import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsRepository } from './transactions.repository.js';
import { TransactionsService } from './transactions.service.js';

/**
 * Модуль транзакций: контроллер, сервис и репозиторий.
 *
 * `PrismaService` приходит из глобального `PrismaModule`, `QueryBus` — из
 * `CqrsModule` корневого модуля. С категориями работает только через
 * `QueryBus`, `CategoriesModule` не импортирует.
 */
@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsRepository],
})
export class TransactionsModule {}
